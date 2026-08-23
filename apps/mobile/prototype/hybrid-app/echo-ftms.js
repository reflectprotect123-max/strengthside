/**
 * Rogue Echo Bike V3 FTMS Indoor Bike Data parser + Web Bluetooth connect.
 * Ported from hybrid research starter (read-only telemetry; no Control Point).
 * Calories are device-tagged only — never treat as portable nutrition calories.
 */
(function (global) {
  'use strict';

  var ECHO_V3 = {
    service: '00001826-0000-1000-8000-00805f9b34fb',
    indoorBikeData: '00002ad2-0000-1000-8000-00805f9b34fb',
    heartRateService: '0000180d-0000-1000-8000-00805f9b34fb',
  };

  function asDataView(source) {
    if (source instanceof ArrayBuffer) return new DataView(source);
    return new DataView(source.buffer, source.byteOffset, source.byteLength);
  }

  function requireBytes(view, offset, size, field) {
    if (offset + size > view.byteLength) {
      throw new RangeError('Truncated FTMS Indoor Bike Data before ' + field);
    }
  }

  function readU8(view, offset, field) {
    requireBytes(view, offset, 1, field);
    return view.getUint8(offset);
  }
  function readU16(view, offset, field) {
    requireBytes(view, offset, 2, field);
    return view.getUint16(offset, true);
  }
  function readI16(view, offset, field) {
    requireBytes(view, offset, 2, field);
    return view.getInt16(offset, true);
  }
  function readU24(view, offset, field) {
    requireBytes(view, offset, 3, field);
    return view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
  }

  function parseIndoorBikeData(source) {
    var view = asDataView(source);
    requireBytes(view, 0, 2, 'flags');
    var flags = view.getUint16(0, true);
    var offset = 2;
    var result = { flags: flags };

    if ((flags & 0x0001) === 0) {
      result.speed_kmh = readU16(view, offset, 'instantaneous speed') * 0.01;
      offset += 2;
    }
    if (flags & 0x0002) {
      result.average_speed_kmh = readU16(view, offset, 'average speed') * 0.01;
      offset += 2;
    }
    if (flags & 0x0004) {
      result.cadence_rpm = readU16(view, offset, 'instantaneous cadence') * 0.5;
      offset += 2;
    }
    if (flags & 0x0008) {
      result.average_cadence_rpm = readU16(view, offset, 'average cadence') * 0.5;
      offset += 2;
    }
    if (flags & 0x0010) {
      result.distance_m = readU24(view, offset, 'total distance');
      offset += 3;
    }
    if (flags & 0x0020) {
      result.resistance_level = readI16(view, offset, 'resistance level');
      offset += 2;
    }
    if (flags & 0x0040) {
      result.power_w = readI16(view, offset, 'instantaneous power');
      offset += 2;
    }
    if (flags & 0x0080) {
      result.average_power_w = readI16(view, offset, 'average power');
      offset += 2;
    }
    if (flags & 0x0100) {
      result.calories_total = readU16(view, offset, 'total energy');
      offset += 2;
      result.calories_per_hour = readU16(view, offset, 'energy per hour');
      offset += 2;
      result.calories_per_minute = readU8(view, offset, 'energy per minute');
      offset += 1;
    }
    if (flags & 0x0200) {
      result.heart_rate_bpm = readU8(view, offset, 'heart rate');
      offset += 1;
    }
    if (flags & 0x0400) {
      result.metabolic_equivalent = readU8(view, offset, 'metabolic equivalent') * 0.1;
      offset += 1;
    }
    if (flags & 0x0800) {
      result.elapsed_s = readU16(view, offset, 'elapsed time');
      offset += 2;
    }
    if (flags & 0x1000) {
      result.remaining_s = readU16(view, offset, 'remaining time');
    }
    return result;
  }

  function toEchoV3Event(source, receivedAt) {
    receivedAt = receivedAt || new Date();
    var bytes =
      source instanceof ArrayBuffer
        ? new Uint8Array(source)
        : new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    var metrics = parseIndoorBikeData(source);
    metrics.received_at = receivedAt.toISOString();
    metrics.raw_hex = Array.prototype.map
      .call(bytes, function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
    return metrics;
  }

  function bluetoothAvailable() {
    return !!(global.navigator && global.navigator.bluetooth && global.navigator.bluetooth.requestDevice);
  }

  function unsupportedReason() {
    if (bluetoothAvailable()) return '';
    var ua = String((global.navigator && global.navigator.userAgent) || '');
    if (/iPhone|iPad|iPod/i.test(ua)) return 'Echo FTMS needs Chrome on Android (or desktop). iOS Safari cannot connect.';
    return 'Web Bluetooth unavailable — use Chrome on Android or desktop for Echo.';
  }

  async function connectEchoV3(onEvent, onDisconnected) {
    if (!bluetoothAvailable()) throw new Error(unsupportedReason() || 'Web Bluetooth unavailable');
    var device = await global.navigator.bluetooth.requestDevice({
      filters: [{ services: [ECHO_V3.service] }],
      optionalServices: [ECHO_V3.heartRateService],
    });
    var server = await device.gatt.connect();
    var service = await server.getPrimaryService(ECHO_V3.service);
    var characteristic = await service.getCharacteristic(ECHO_V3.indoorBikeData);

    var onValue = function (event) {
      var source = event.target && event.target.value;
      if (source) onEvent(toEchoV3Event(source));
    };
    var onLinkLoss = function () {
      if (onDisconnected) onDisconnected();
    };

    characteristic.addEventListener('characteristicvaluechanged', onValue);
    device.addEventListener('gattserverdisconnected', onLinkLoss);
    await characteristic.startNotifications();

    var closed = false;
    return {
      device: device,
      disconnect: function () {
        if (closed) return;
        closed = true;
        characteristic.removeEventListener('characteristicvaluechanged', onValue);
        device.removeEventListener('gattserverdisconnected', onLinkLoss);
        if (device.gatt && device.gatt.connected) device.gatt.disconnect();
      },
    };
  }

  global.EchoFtms = {
    ECHO_V3: ECHO_V3,
    parseIndoorBikeData: parseIndoorBikeData,
    toEchoV3Event: toEchoV3Event,
    bluetoothAvailable: bluetoothAvailable,
    unsupportedReason: unsupportedReason,
    connectEchoV3: connectEchoV3,
  };
})(typeof window !== 'undefined' ? window : globalThis);
