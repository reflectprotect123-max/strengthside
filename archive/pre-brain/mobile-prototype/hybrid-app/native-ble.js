/**
 * Native BLE (Capacitor) for HR strap + Echo FTMS in the Hybrid APK.
 * Web Bluetooth stays in index.html / echo-ftms.js for Chrome.
 */
(function (global) {
  'use strict';

  var HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
  var HR_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
  var FTMS_SERVICE = '00001826-0000-1000-8000-00805f9b34fb';
  var INDOOR_BIKE_DATA = '00002ad2-0000-1000-8000-00805f9b34fb';

  var initialized = false;
  var listeners = Object.create(null);

  function isNative() {
    try {
      return !!(global.NativeBridge && NativeBridge.isNative && NativeBridge.isNative());
    } catch (_) {
      return false;
    }
  }

  function blePlugin() {
    try {
      return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.BluetoothLe;
    } catch (_) {
      return null;
    }
  }

  function isAvailable() {
    return isNative() && !!blePlugin();
  }

  function parseUUID(uuid) {
    var u = String(uuid || '').toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(u)) {
      throw new Error('Invalid UUID format ' + u);
    }
    return u;
  }

  function hexStringToDataView(hex) {
    var bin = [];
    var buffer = 0;
    var isEmpty = 1;
    for (var i = 0; i < hex.length; i++) {
      var c = hex.charCodeAt(i);
      if ((c > 47 && c < 58) || (c > 64 && c < 71) || (c > 96 && c < 103)) {
        buffer = (buffer << 4) ^ ((c > 64 ? c + 9 : c) & 15);
        if ((isEmpty ^= 1)) bin.push(buffer & 0xff);
      }
    }
    return new DataView(Uint8Array.from(bin).buffer);
  }

  function convertValue(value) {
    if (typeof value === 'string') return hexStringToDataView(value);
    if (value instanceof DataView) return value;
    if (value && value.buffer) return new DataView(value.buffer, value.byteOffset || 0, value.byteLength || value.buffer.byteLength);
    return new DataView(new ArrayBuffer(0));
  }

  function parseHeartRate(dv) {
    if (!dv || !dv.byteLength) return 0;
    var flags = dv.getUint8(0);
    return flags & 1 ? dv.getUint16(1, true) : dv.getUint8(1);
  }

  async function removeListener(key) {
    var handle = listeners[key];
    if (handle && handle.remove) {
      try {
        await handle.remove();
      } catch (_) {}
    }
    delete listeners[key];
  }

  async function addListener(key, cb) {
    await removeListener(key);
    var plugin = blePlugin();
    listeners[key] = await plugin.addListener(key, cb);
  }

  async function ensureInit() {
    if (initialized) return;
    var plugin = blePlugin();
    if (!plugin) throw new Error('Bluetooth LE plugin unavailable');
    await plugin.initialize({ androidNeverForLocation: true });
    initialized = true;
  }

  async function startCharacteristicNotifications(deviceId, service, characteristic, onValue) {
    service = parseUUID(service);
    characteristic = parseUUID(characteristic);
    var key = 'notification|' + deviceId + '|' + service + '|' + characteristic;
    await addListener(key, function (event) {
      onValue(convertValue(event && event.value));
    });
    await blePlugin().startNotifications({ deviceId: deviceId, service: service, characteristic: characteristic });
  }

  async function stopCharacteristicNotifications(deviceId, service, characteristic) {
    service = parseUUID(service);
    characteristic = parseUUID(characteristic);
    var key = 'notification|' + deviceId + '|' + service + '|' + characteristic;
    await removeListener(key);
    try {
      await blePlugin().stopNotifications({ deviceId: deviceId, service: service, characteristic: characteristic });
    } catch (_) {}
  }

  async function connectDevice(options, onDisconnected) {
    await ensureInit();
    var plugin = blePlugin();
    var device = await plugin.requestDevice(options || {});
    var deviceId = device.deviceId;
    var name = device.name || device.deviceName || 'Bluetooth device';
    if (onDisconnected) {
      await addListener('disconnected|' + deviceId, function () {
        onDisconnected(deviceId);
      });
    }
    await plugin.connect({ deviceId: deviceId });
    return { deviceId: deviceId, name: name, device: { name: name } };
  }

  /**
   * @returns {Promise<{deviceId:string,name:string,device:{name:string},pause:Function,resume:Function,disconnect:Function}>}
   */
  async function connectHeartRate(onBpm, onDisconnected) {
    var base = await connectDevice({ services: [HR_SERVICE] }, onDisconnected);
    var deviceId = base.deviceId;
    var paused = false;

    async function deliver(dv) {
      if (paused) return;
      var bpm = parseHeartRate(dv);
      if (bpm >= 30 && bpm <= 250 && onBpm) onBpm(bpm);
    }

    await startCharacteristicNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT, deliver);

    return {
      deviceId: deviceId,
      name: base.name,
      device: base.device,
      pause: async function () {
        paused = true;
        await stopCharacteristicNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT);
      },
      resume: async function () {
        paused = false;
        await startCharacteristicNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT, deliver);
      },
      disconnect: async function () {
        paused = true;
        await stopCharacteristicNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT);
        await removeListener('disconnected|' + deviceId);
        try {
          await blePlugin().disconnect({ deviceId: deviceId });
        } catch (_) {}
      },
    };
  }

  /**
   * @returns {Promise<{deviceId:string,name:string,device:{name:string},disconnect:Function}>}
   */
  async function connectEchoFtms(onEvent, onDisconnected) {
    var base = await connectDevice(
      {
        services: [FTMS_SERVICE],
        optionalServices: [HR_SERVICE],
      },
      onDisconnected,
    );
    var deviceId = base.deviceId;

    await startCharacteristicNotifications(deviceId, FTMS_SERVICE, INDOOR_BIKE_DATA, function (dv) {
      if (!onEvent) return;
      if (global.EchoFtms && EchoFtms.toEchoV3Event) onEvent(EchoFtms.toEchoV3Event(dv));
      else if (global.EchoFtms && EchoFtms.parseIndoorBikeData) onEvent(EchoFtms.parseIndoorBikeData(dv));
    });

    return {
      deviceId: deviceId,
      name: base.name,
      device: base.device,
      disconnect: async function () {
        await stopCharacteristicNotifications(deviceId, FTMS_SERVICE, INDOOR_BIKE_DATA);
        await removeListener('disconnected|' + deviceId);
        try {
          await blePlugin().disconnect({ deviceId: deviceId });
        } catch (_) {}
      },
    };
  }

  global.NativeBle = {
    isNative: isNative,
    isAvailable: isAvailable,
    connectHeartRate: connectHeartRate,
    connectEchoFtms: connectEchoFtms,
    parseHeartRate: parseHeartRate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
