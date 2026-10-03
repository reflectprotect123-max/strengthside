(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // apps/mobile/capacitor/node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/conversion.js
  function numbersToDataView(value) {
    return new DataView(Uint8Array.from(value).buffer);
  }
  function dataViewToNumbers(value) {
    return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  function numberToUUID(value) {
    return `0000${value.toString(16).padStart(4, "0")}-0000-1000-8000-00805f9b34fb`;
  }
  function hexStringToDataView(hex) {
    const bin = [];
    let i, c, isEmpty = 1, buffer = 0;
    for (i = 0; i < hex.length; i++) {
      c = hex.charCodeAt(i);
      if (c > 47 && c < 58 || c > 64 && c < 71 || c > 96 && c < 103) {
        buffer = buffer << 4 ^ (c > 64 ? c + 9 : c) & 15;
        if (isEmpty ^= 1) {
          bin.push(buffer & 255);
        }
      }
    }
    return numbersToDataView(bin);
  }
  function dataViewToHexString(value) {
    return dataViewToNumbers(value).map((n) => {
      let s2 = n.toString(16);
      if (s2.length == 1) {
        s2 = "0" + s2;
      }
      return s2;
    }).join("");
  }
  function webUUIDToString(uuid) {
    if (typeof uuid === "string") {
      return uuid;
    } else if (typeof uuid === "number") {
      return numberToUUID(uuid);
    } else {
      throw new Error("Invalid UUID");
    }
  }
  function mapToObject(map) {
    const obj = {};
    if (!map) {
      return void 0;
    }
    map.forEach((value, key) => {
      obj[key.toString()] = value;
    });
    return obj;
  }
  function toUint8Array(value) {
    if (value === void 0) {
      return void 0;
    }
    if (typeof value === "string") {
      const dataView = hexStringToDataView(value);
      return new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    }
    if (value instanceof DataView) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return value;
  }
  function toHexString(value) {
    if (value === void 0) {
      return void 0;
    }
    if (value instanceof DataView) {
      return dataViewToHexString(value);
    }
    return dataViewToHexString(new DataView(value.buffer, value.byteOffset, value.byteLength));
  }
  function toArrayBufferDataView(value) {
    if (typeof SharedArrayBuffer !== "undefined" && value.buffer instanceof SharedArrayBuffer) {
      const uint8Array = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const buffer = uint8Array.slice().buffer;
      return new DataView(buffer);
    }
    return value;
  }
  var init_conversion = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/conversion.js"() {
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/timeout.js
  async function runWithTimeout(promise, time, exception) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(exception), time);
      })
    ]).finally(() => clearTimeout(timer));
  }
  var init_timeout = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/timeout.js"() {
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    BluetoothLeWeb: () => BluetoothLeWeb
  });
  var BluetoothLeWeb;
  var init_web = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/web.js"() {
      init_dist();
      init_conversion();
      init_timeout();
      BluetoothLeWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.deviceMap = /* @__PURE__ */ new Map();
          this.discoveredDevices = /* @__PURE__ */ new Map();
          this.scan = null;
          this.DEFAULT_CONNECTION_TIMEOUT = 1e4;
          this.onAdvertisementReceivedCallback = this.onAdvertisementReceived.bind(this);
          this.onDisconnectedCallback = this.onDisconnected.bind(this);
          this.onCharacteristicValueChangedCallback = this.onCharacteristicValueChanged.bind(this);
        }
        async initialize() {
          if (typeof navigator === "undefined" || !navigator.bluetooth) {
            throw this.unavailable("Web Bluetooth API not available in this browser.");
          }
          const isAvailable = await navigator.bluetooth.getAvailability();
          if (!isAvailable) {
            throw this.unavailable("No Bluetooth radio available.");
          }
        }
        async isEnabled() {
          return { value: true };
        }
        async requestEnable() {
          throw this.unavailable("requestEnable is not available on web.");
        }
        async enable() {
          throw this.unavailable("enable is not available on web.");
        }
        async disable() {
          throw this.unavailable("disable is not available on web.");
        }
        async startEnabledNotifications() {
        }
        async stopEnabledNotifications() {
        }
        async isLocationEnabled() {
          throw this.unavailable("isLocationEnabled is not available on web.");
        }
        async openLocationSettings() {
          throw this.unavailable("openLocationSettings is not available on web.");
        }
        async openBluetoothSettings() {
          throw this.unavailable("openBluetoothSettings is not available on web.");
        }
        async openAppSettings() {
          throw this.unavailable("openAppSettings is not available on web.");
        }
        async setDisplayStrings() {
        }
        async requestDevice(options) {
          const filters = this.getFilters(options);
          const device = await navigator.bluetooth.requestDevice({
            filters: filters.length ? filters : void 0,
            optionalServices: options === null || options === void 0 ? void 0 : options.optionalServices,
            acceptAllDevices: filters.length === 0
          });
          this.deviceMap.set(device.id, device);
          const bleDevice = this.getBleDevice(device);
          return bleDevice;
        }
        async requestLEScan(options) {
          this.requestBleDeviceOptions = options;
          const filters = this.getFilters(options);
          await this.stopLEScan();
          this.discoveredDevices = /* @__PURE__ */ new Map();
          navigator.bluetooth.removeEventListener("advertisementreceived", this.onAdvertisementReceivedCallback);
          navigator.bluetooth.addEventListener("advertisementreceived", this.onAdvertisementReceivedCallback);
          this.scan = await navigator.bluetooth.requestLEScan({
            filters: filters.length ? filters : void 0,
            acceptAllAdvertisements: filters.length === 0,
            keepRepeatedDevices: options === null || options === void 0 ? void 0 : options.allowDuplicates
          });
        }
        onAdvertisementReceived(event) {
          var _a, _b, _c;
          const deviceId = event.device.id;
          this.deviceMap.set(deviceId, event.device);
          const isNew = !this.discoveredDevices.has(deviceId);
          if (((_a = this.requestBleDeviceOptions) === null || _a === void 0 ? void 0 : _a.serviceData) && !this.matchesServiceDataFilter(event)) {
            return;
          }
          if (isNew || ((_b = this.requestBleDeviceOptions) === null || _b === void 0 ? void 0 : _b.allowDuplicates)) {
            this.discoveredDevices.set(deviceId, true);
            const device = this.getBleDevice(event.device);
            const result = {
              device,
              localName: device.name,
              rssi: event.rssi,
              txPower: event.txPower,
              manufacturerData: mapToObject(event.manufacturerData),
              serviceData: mapToObject(event.serviceData),
              uuids: (_c = event.uuids) === null || _c === void 0 ? void 0 : _c.map(webUUIDToString)
            };
            this.notifyListeners("onScanResult", result);
          }
        }
        async stopLEScan() {
          var _a;
          if ((_a = this.scan) === null || _a === void 0 ? void 0 : _a.active) {
            this.scan.stop();
          }
          this.scan = null;
        }
        async getDevices(options) {
          const devices = await navigator.bluetooth.getDevices();
          const bleDevices = devices.filter((device) => options.deviceIds.includes(device.id)).map((device) => {
            this.deviceMap.set(device.id, device);
            const bleDevice = this.getBleDevice(device);
            return bleDevice;
          });
          return { devices: bleDevices };
        }
        async getConnectedDevices(_options) {
          const devices = await navigator.bluetooth.getDevices();
          const bleDevices = devices.filter((device) => {
            var _a;
            return (_a = device.gatt) === null || _a === void 0 ? void 0 : _a.connected;
          }).map((device) => {
            this.deviceMap.set(device.id, device);
            const bleDevice = this.getBleDevice(device);
            return bleDevice;
          });
          return { devices: bleDevices };
        }
        async getBondedDevices() {
          return {};
        }
        async connect(options) {
          var _a, _b;
          const device = this.getDeviceFromMap(options.deviceId);
          device.removeEventListener("gattserverdisconnected", this.onDisconnectedCallback);
          device.addEventListener("gattserverdisconnected", this.onDisconnectedCallback);
          const timeoutError = /* @__PURE__ */ Symbol();
          if (device.gatt === void 0) {
            throw new Error("No gatt server available.");
          }
          try {
            const timeout = (_a = options.timeout) !== null && _a !== void 0 ? _a : this.DEFAULT_CONNECTION_TIMEOUT;
            await runWithTimeout(device.gatt.connect(), timeout, timeoutError);
          } catch (error) {
            await ((_b = device.gatt) === null || _b === void 0 ? void 0 : _b.disconnect());
            if (error === timeoutError) {
              throw new Error("Connection timeout");
            } else {
              throw error;
            }
          }
        }
        onDisconnected(event) {
          const deviceId = event.target.id;
          const key = `disconnected|${deviceId}`;
          this.notifyListeners(key, null);
        }
        async createBond(_options) {
          throw this.unavailable("createBond is not available on web.");
        }
        async isBonded(_options) {
          throw this.unavailable("isBonded is not available on web.");
        }
        async disconnect(options) {
          var _a;
          (_a = this.getDeviceFromMap(options.deviceId).gatt) === null || _a === void 0 ? void 0 : _a.disconnect();
        }
        async getServices(options) {
          var _a, _b;
          const services = (_b = await ((_a = this.getDeviceFromMap(options.deviceId).gatt) === null || _a === void 0 ? void 0 : _a.getPrimaryServices())) !== null && _b !== void 0 ? _b : [];
          const bleServices = [];
          for (const service of services) {
            const characteristics = await service.getCharacteristics();
            const bleCharacteristics = [];
            for (const characteristic of characteristics) {
              bleCharacteristics.push({
                uuid: characteristic.uuid,
                properties: this.getProperties(characteristic),
                descriptors: await this.getDescriptors(characteristic)
              });
            }
            bleServices.push({ uuid: service.uuid, characteristics: bleCharacteristics });
          }
          return { services: bleServices };
        }
        async getDescriptors(characteristic) {
          try {
            const descriptors = await characteristic.getDescriptors();
            return descriptors.map((descriptor) => ({
              uuid: descriptor.uuid
            }));
          } catch (_a) {
            return [];
          }
        }
        getProperties(characteristic) {
          return {
            broadcast: characteristic.properties.broadcast,
            read: characteristic.properties.read,
            writeWithoutResponse: characteristic.properties.writeWithoutResponse,
            write: characteristic.properties.write,
            notify: characteristic.properties.notify,
            indicate: characteristic.properties.indicate,
            authenticatedSignedWrites: characteristic.properties.authenticatedSignedWrites,
            reliableWrite: characteristic.properties.reliableWrite,
            writableAuxiliaries: characteristic.properties.writableAuxiliaries
          };
        }
        async getCharacteristic(options) {
          var _a;
          const service = await ((_a = this.getDeviceFromMap(options.deviceId).gatt) === null || _a === void 0 ? void 0 : _a.getPrimaryService(options === null || options === void 0 ? void 0 : options.service));
          return service === null || service === void 0 ? void 0 : service.getCharacteristic(options === null || options === void 0 ? void 0 : options.characteristic);
        }
        async getDescriptor(options) {
          const characteristic = await this.getCharacteristic(options);
          return characteristic === null || characteristic === void 0 ? void 0 : characteristic.getDescriptor(options === null || options === void 0 ? void 0 : options.descriptor);
        }
        async discoverServices(_options) {
          throw this.unavailable("discoverServices is not available on web.");
        }
        async getMtu(_options) {
          throw this.unavailable("getMtu is not available on web.");
        }
        async requestConnectionPriority(_options) {
          throw this.unavailable("requestConnectionPriority is not available on web.");
        }
        async readRssi(_options) {
          throw this.unavailable("readRssi is not available on web.");
        }
        async read(options) {
          const characteristic = await this.getCharacteristic(options);
          const value = await (characteristic === null || characteristic === void 0 ? void 0 : characteristic.readValue());
          return { value };
        }
        async write(options) {
          const characteristic = await this.getCharacteristic(options);
          let dataView;
          if (typeof options.value === "string") {
            dataView = hexStringToDataView(options.value);
          } else {
            dataView = options.value;
          }
          await (characteristic === null || characteristic === void 0 ? void 0 : characteristic.writeValueWithResponse(toArrayBufferDataView(dataView)));
        }
        async writeWithoutResponse(options) {
          const characteristic = await this.getCharacteristic(options);
          let dataView;
          if (typeof options.value === "string") {
            dataView = hexStringToDataView(options.value);
          } else {
            dataView = options.value;
          }
          await (characteristic === null || characteristic === void 0 ? void 0 : characteristic.writeValueWithoutResponse(toArrayBufferDataView(dataView)));
        }
        async readDescriptor(options) {
          const descriptor = await this.getDescriptor(options);
          const value = await (descriptor === null || descriptor === void 0 ? void 0 : descriptor.readValue());
          return { value };
        }
        async writeDescriptor(options) {
          const descriptor = await this.getDescriptor(options);
          let dataView;
          if (typeof options.value === "string") {
            dataView = hexStringToDataView(options.value);
          } else {
            dataView = options.value;
          }
          await (descriptor === null || descriptor === void 0 ? void 0 : descriptor.writeValue(toArrayBufferDataView(dataView)));
        }
        async startNotifications(options) {
          const characteristic = await this.getCharacteristic(options);
          characteristic === null || characteristic === void 0 ? void 0 : characteristic.removeEventListener("characteristicvaluechanged", this.onCharacteristicValueChangedCallback);
          characteristic === null || characteristic === void 0 ? void 0 : characteristic.addEventListener("characteristicvaluechanged", this.onCharacteristicValueChangedCallback);
          await (characteristic === null || characteristic === void 0 ? void 0 : characteristic.startNotifications());
        }
        onCharacteristicValueChanged(event) {
          var _a, _b;
          const characteristic = event.target;
          const key = `notification|${(_a = characteristic.service) === null || _a === void 0 ? void 0 : _a.device.id}|${(_b = characteristic.service) === null || _b === void 0 ? void 0 : _b.uuid}|${characteristic.uuid}`;
          this.notifyListeners(key, {
            value: characteristic.value
          });
        }
        async stopNotifications(options) {
          const characteristic = await this.getCharacteristic(options);
          await (characteristic === null || characteristic === void 0 ? void 0 : characteristic.stopNotifications());
        }
        getFilters(options) {
          var _a, _b;
          const filters = [];
          for (const service of (_a = options === null || options === void 0 ? void 0 : options.services) !== null && _a !== void 0 ? _a : []) {
            filters.push({
              services: [service],
              name: options === null || options === void 0 ? void 0 : options.name,
              namePrefix: options === null || options === void 0 ? void 0 : options.namePrefix
            });
          }
          if (((options === null || options === void 0 ? void 0 : options.name) || (options === null || options === void 0 ? void 0 : options.namePrefix)) && filters.length === 0) {
            filters.push({
              name: options.name,
              namePrefix: options.namePrefix
            });
          }
          for (const manufacturerData of (_b = options === null || options === void 0 ? void 0 : options.manufacturerData) !== null && _b !== void 0 ? _b : []) {
            filters.push({
              manufacturerData: [manufacturerData]
            });
          }
          return filters;
        }
        matchesServiceDataFilter(event) {
          var _a;
          const filters = (_a = this.requestBleDeviceOptions) === null || _a === void 0 ? void 0 : _a.serviceData;
          if (!filters || filters.length === 0) {
            return true;
          }
          if (!event.serviceData) {
            return false;
          }
          for (const filter of filters) {
            const serviceData = event.serviceData.get(filter.serviceUuid);
            if (!serviceData) {
              continue;
            }
            if (!filter.dataPrefix) {
              return true;
            }
            const data = new Uint8Array(serviceData.buffer);
            const prefixView = filter.dataPrefix;
            if (data.length < prefixView.byteLength) {
              continue;
            }
            if (filter.mask) {
              const maskView = filter.mask;
              let matches = true;
              for (let i = 0; i < prefixView.byteLength; i++) {
                if ((data[i] & maskView.getUint8(i)) !== (prefixView.getUint8(i) & maskView.getUint8(i))) {
                  matches = false;
                  break;
                }
              }
              if (matches) {
                return true;
              }
            } else {
              let matches = true;
              for (let i = 0; i < prefixView.byteLength; i++) {
                if (data[i] !== prefixView.getUint8(i)) {
                  matches = false;
                  break;
                }
              }
              if (matches) {
                return true;
              }
            }
          }
          return false;
        }
        getDeviceFromMap(deviceId) {
          const device = this.deviceMap.get(deviceId);
          if (device === void 0) {
            throw new Error('Device not found. Call "requestDevice", "requestLEScan" or "getDevices" first.');
          }
          return device;
        }
        getBleDevice(device) {
          var _a;
          const bleDevice = {
            deviceId: device.id,
            // use undefined instead of null if name is not available
            name: (_a = device.name) !== null && _a !== void 0 ? _a : void 0
          };
          return bleDevice;
        }
      };
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor/browser/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    Browser: () => Browser,
    BrowserWeb: () => BrowserWeb
  });
  var BrowserWeb, Browser;
  var init_web2 = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor/browser/dist/esm/web.js"() {
      init_dist();
      BrowserWeb = class extends WebPlugin {
        constructor() {
          super();
          this._lastWindow = null;
        }
        async open(options) {
          this._lastWindow = window.open(options.url, options.windowName || "_blank");
        }
        async close() {
          return new Promise((resolve2, reject) => {
            if (this._lastWindow != null) {
              this._lastWindow.close();
              this._lastWindow = null;
              resolve2();
            } else {
              reject("No active window to close!");
            }
          });
        }
      };
      Browser = new BrowserWeb();
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor/app/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    AppWeb: () => AppWeb
  });
  var AppWeb;
  var init_web3 = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor/app/dist/esm/web.js"() {
      init_dist();
      AppWeb = class extends WebPlugin {
        constructor() {
          super();
          this.handleVisibilityChange = () => {
            const data = {
              isActive: document.hidden !== true
            };
            this.notifyListeners("appStateChange", data);
            if (document.hidden) {
              this.notifyListeners("pause", null);
            } else {
              this.notifyListeners("resume", null);
            }
          };
          document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
        }
        exitApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getInfo() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getLaunchUrl() {
          return { url: "" };
        }
        async getState() {
          return { isActive: document.hidden !== true };
        }
        async minimizeApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async toggleBackButtonHandler() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getAppLanguage() {
          return {
            value: navigator.language.split("-")[0].toLowerCase()
          };
        }
      };
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
      (function(Directory2) {
        Directory2["Documents"] = "DOCUMENTS";
        Directory2["Data"] = "DATA";
        Directory2["Library"] = "LIBRARY";
        Directory2["Cache"] = "CACHE";
        Directory2["External"] = "EXTERNAL";
        Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
        Directory2["ExternalCache"] = "EXTERNAL_CACHE";
        Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
        Directory2["Temporary"] = "TEMPORARY";
      })(Directory || (Directory = {}));
      (function(Encoding2) {
        Encoding2["UTF8"] = "utf8";
        Encoding2["ASCII"] = "ascii";
        Encoding2["UTF16"] = "utf16";
      })(Encoding || (Encoding = {}));
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/web.js
  var web_exports4 = {};
  __export(web_exports4, {
    FilesystemWeb: () => FilesystemWeb
  });
  function resolve(path) {
    const posix = path.split("/").filter((item) => item !== ".");
    const newPosix = [];
    posix.forEach((item) => {
      if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
        newPosix.pop();
      } else {
        newPosix.push(item);
      }
    });
    return newPosix.join("/");
  }
  function isPathParent(parent, children) {
    parent = resolve(parent);
    children = resolve(children);
    const pathsA = parent.split("/");
    const pathsB = children.split("/");
    return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
  }
  var FilesystemWeb;
  var init_web4 = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      FilesystemWeb = class _FilesystemWeb extends WebPlugin {
        constructor() {
          super(...arguments);
          this.DB_VERSION = 1;
          this.DB_NAME = "Disc";
          this._writeCmds = ["add", "put", "delete"];
          this.downloadFile = async (options) => {
            var _a, _b;
            const requestInit = buildRequestInit(options, options.webFetchExtra);
            const response = await fetch(options.url, requestInit);
            let blob;
            if (!options.progress)
              blob = await response.blob();
            else if (!(response === null || response === void 0 ? void 0 : response.body))
              blob = new Blob();
            else {
              const reader = response.body.getReader();
              let bytes = 0;
              const chunks = [];
              const contentType = response.headers.get("content-type");
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                chunks.push(value);
                bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
                const status = {
                  url: options.url,
                  bytes,
                  contentLength
                };
                this.notifyListeners("progress", status);
              }
              const allChunks = new Uint8Array(bytes);
              let position = 0;
              for (const chunk of chunks) {
                if (typeof chunk === "undefined")
                  continue;
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
            }
            const result = await this.writeFile({
              path: options.path,
              directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
              recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
              data: blob
            });
            return { path: result.uri, blob };
          };
        }
        readFileInChunks(_options, _callback) {
          throw this.unavailable("Method not implemented.");
        }
        async initDb() {
          if (this._db !== void 0) {
            return this._db;
          }
          if (!("indexedDB" in window)) {
            throw this.unavailable("This browser doesn't support IndexedDB");
          }
          return new Promise((resolve2, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = _FilesystemWeb.doUpgrade;
            request.onsuccess = () => {
              this._db = request.result;
              resolve2(request.result);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              console.warn("db blocked");
            };
          });
        }
        static doUpgrade(event) {
          const eventTarget = event.target;
          const db = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db.objectStoreNames.contains("FileStorage")) {
                db.deleteObjectStore("FileStorage");
              }
              const store = db.createObjectStore("FileStorage", { keyPath: "path" });
              store.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const req = store[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        async dbIndexRequest(indexName, cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const index = store.index(indexName);
              const req = index[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        getPath(directory, uriPath) {
          const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
          let fsPath = "";
          if (directory !== void 0)
            fsPath += "/" + directory;
          if (uriPath !== "")
            fsPath += "/" + cleanedUriPath;
          return fsPath;
        }
        async clear() {
          const conn = await this.initDb();
          const tx = conn.transaction(["FileStorage"], "readwrite");
          const store = tx.objectStore("FileStorage");
          store.clear();
        }
        /**
         * Read a file from disk
         * @param options options for the file read
         * @return a promise that resolves with the read file data result
         */
        async readFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          return { data: entry.content ? entry.content : "" };
        }
        /**
         * Write a file to disk in the specified location on device
         * @param options options for the file write
         * @return a promise that resolves with the file write result
         */
        async writeFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const doRecursive = options.recursive;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: doRecursive
              });
            }
          }
          if (!encoding && !(data instanceof Blob)) {
            data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
            if (!this.isBase64String(data))
              throw Error("The supplied data is not valid base64 content.");
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data instanceof Blob ? data.size : data.length,
            ctime: now,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
          return {
            uri: pathObj.path
          };
        }
        /**
         * Append to a file on disk in the specified location on device
         * @param options options for the file append
         * @return a promise that resolves with the file write result
         */
        async appendFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const now = Date.now();
          let ctime = now;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: true
              });
            }
          }
          if (!encoding && !this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
          if (occupiedEntry !== void 0) {
            if (occupiedEntry.content instanceof Blob) {
              throw Error("The occupied entry contains a Blob object which cannot be appended to.");
            }
            if (occupiedEntry.content !== void 0 && !encoding) {
              data = btoa(atob(occupiedEntry.content) + atob(data));
            } else {
              data = occupiedEntry.content + data;
            }
            ctime = occupiedEntry.ctime;
          }
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data.length,
            ctime,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Delete a file from disk
         * @param options options for the file delete
         * @return a promise that resolves with the deleted file data result
         */
        async deleteFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          if (entries.length !== 0)
            throw Error("Folder is not empty.");
          await this.dbRequest("delete", [path]);
        }
        /**
         * Create a directory.
         * @param options options for the mkdir
         * @return a promise that resolves with the mkdir result
         */
        async mkdir(options) {
          const path = this.getPath(options.directory, options.path);
          const doRecursive = options.recursive;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const depth = (path.match(/\//g) || []).length;
          const parentEntry = await this.dbRequest("get", [parentPath]);
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (depth === 1)
            throw Error("Cannot create Root directory");
          if (occupiedEntry !== void 0)
            throw Error("Current directory does already exist.");
          if (!doRecursive && depth !== 2 && parentEntry === void 0)
            throw Error("Parent directory must exist");
          if (doRecursive && depth !== 2 && parentEntry === void 0) {
            const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "directory",
            size: 0,
            ctime: now,
            mtime: now
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Remove a directory
         * @param options the options for the directory remove
         */
        async rmdir(options) {
          const { path, directory, recursive } = options;
          const fullPath = this.getPath(directory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          if (entry === void 0)
            throw Error("Folder does not exist.");
          if (entry.type !== "directory")
            throw Error("Requested path is not a directory");
          const readDirResult = await this.readdir({ path, directory });
          if (readDirResult.files.length !== 0 && !recursive)
            throw Error("Folder is not empty");
          for (const entry2 of readDirResult.files) {
            const entryPath = `${path}/${entry2.name}`;
            const entryObj = await this.stat({ path: entryPath, directory });
            if (entryObj.type === "file") {
              await this.deleteFile({ path: entryPath, directory });
            } else {
              await this.rmdir({ path: entryPath, directory, recursive });
            }
          }
          await this.dbRequest("delete", [fullPath]);
        }
        /**
         * Return a list of files from the directory (not recursive)
         * @param options the options for the readdir operation
         * @return a promise that resolves with the readdir directory listing result
         */
        async readdir(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (options.path !== "" && entry === void 0)
            throw Error("Folder does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          const files = await Promise.all(entries.map(async (e) => {
            let subEntry = await this.dbRequest("get", [e]);
            if (subEntry === void 0) {
              subEntry = await this.dbRequest("get", [e + "/"]);
            }
            return {
              name: e.substring(path.length + 1),
              type: subEntry.type,
              size: subEntry.size,
              ctime: subEntry.ctime,
              mtime: subEntry.mtime,
              uri: subEntry.path
            };
          }));
          return { files };
        }
        /**
         * Return full File URI for a path and directory
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async getUri(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          return {
            uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
          };
        }
        /**
         * Return data about a file
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async stat(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          if (entry === void 0)
            throw Error("Entry does not exist.");
          return {
            name: entry.path.substring(path.length + 1),
            type: entry.type,
            size: entry.size,
            ctime: entry.ctime,
            mtime: entry.mtime,
            uri: entry.path
          };
        }
        /**
         * Rename a file or directory
         * @param options the options for the rename operation
         * @return a promise that resolves with the rename result
         */
        async rename(options) {
          await this._copy(options, true);
          return;
        }
        /**
         * Copy a file or directory
         * @param options the options for the copy operation
         * @return a promise that resolves with the copy result
         */
        async copy(options) {
          return this._copy(options, false);
        }
        async requestPermissions() {
          return { publicStorage: "granted" };
        }
        async checkPermissions() {
          return { publicStorage: "granted" };
        }
        /**
         * Function that can perform a copy or a rename
         * @param options the options for the rename operation
         * @param doRename whether to perform a rename or copy operation
         * @return a promise that resolves with the result
         */
        async _copy(options, doRename = false) {
          let { toDirectory } = options;
          const { to, from, directory: fromDirectory } = options;
          if (!to || !from) {
            throw Error("Both to and from must be provided");
          }
          if (!toDirectory) {
            toDirectory = fromDirectory;
          }
          const fromPath = this.getPath(fromDirectory, from);
          const toPath = this.getPath(toDirectory, to);
          if (fromPath === toPath) {
            return {
              uri: toPath
            };
          }
          if (isPathParent(fromPath, toPath)) {
            throw Error("To path cannot contain the from path");
          }
          let toObj;
          try {
            toObj = await this.stat({
              path: to,
              directory: toDirectory
            });
          } catch (e) {
            const toPathComponents = to.split("/");
            toPathComponents.pop();
            const toPath2 = toPathComponents.join("/");
            if (toPathComponents.length > 0) {
              const toParentDirectory = await this.stat({
                path: toPath2,
                directory: toDirectory
              });
              if (toParentDirectory.type !== "directory") {
                throw new Error("Parent directory of the to path is a file");
              }
            }
          }
          if (toObj && toObj.type === "directory") {
            throw new Error("Cannot overwrite a directory with a file");
          }
          const fromObj = await this.stat({
            path: from,
            directory: fromDirectory
          });
          const updateTime = async (path, ctime2, mtime) => {
            const fullPath = this.getPath(toDirectory, path);
            const entry = await this.dbRequest("get", [fullPath]);
            entry.ctime = ctime2;
            entry.mtime = mtime;
            await this.dbRequest("put", [entry]);
          };
          const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
          switch (fromObj.type) {
            // The "from" object is a file
            case "file": {
              const file = await this.readFile({
                path: from,
                directory: fromDirectory
              });
              if (doRename) {
                await this.deleteFile({
                  path: from,
                  directory: fromDirectory
                });
              }
              let encoding;
              if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
                encoding = Encoding.UTF8;
              }
              const writeResult = await this.writeFile({
                path: to,
                directory: toDirectory,
                data: file.data,
                encoding
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
              return writeResult;
            }
            case "directory": {
              if (toObj) {
                throw Error("Cannot move a directory over an existing object");
              }
              try {
                await this.mkdir({
                  path: to,
                  directory: toDirectory,
                  recursive: false
                });
                if (doRename) {
                  await updateTime(to, ctime, fromObj.mtime);
                }
              } catch (e) {
              }
              const contents = (await this.readdir({
                path: from,
                directory: fromDirectory
              })).files;
              for (const filename of contents) {
                await this._copy({
                  from: `${from}/${filename.name}`,
                  to: `${to}/${filename.name}`,
                  directory: fromDirectory,
                  toDirectory
                }, doRename);
              }
              if (doRename) {
                await this.rmdir({
                  path: from,
                  directory: fromDirectory
                });
              }
            }
          }
          return {
            uri: toPath
          };
        }
        isBase64String(str) {
          try {
            return btoa(atob(str)) == str;
          } catch (err) {
            return false;
          }
        }
      };
      FilesystemWeb._debug = true;
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/keep-awake/dist/esm/web.js
  var web_exports5 = {};
  __export(web_exports5, {
    KeepAwakeWeb: () => KeepAwakeWeb
  });
  var KeepAwakeWeb;
  var init_web5 = __esm({
    "apps/mobile/capacitor/node_modules/@capacitor-community/keep-awake/dist/esm/web.js"() {
      init_dist();
      KeepAwakeWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.wakeLock = null;
          this._isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;
          this.handleVisibilityChange = () => {
            if (document.visibilityState === "visible")
              this.keepAwake();
          };
        }
        async keepAwake() {
          if (!this._isSupported) {
            this.throwUnsupportedError();
          }
          if (this.wakeLock) {
            await this.allowSleep();
          }
          this.wakeLock = await navigator.wakeLock.request("screen");
          document.addEventListener("visibilitychange", this.handleVisibilityChange);
          document.addEventListener("fullscreenchange", this.handleVisibilityChange);
        }
        async allowSleep() {
          var _a;
          if (!this._isSupported) {
            this.throwUnsupportedError();
          }
          (_a = this.wakeLock) === null || _a === void 0 ? void 0 : _a.release();
          this.wakeLock = null;
          document.removeEventListener("visibilitychange", this.handleVisibilityChange);
          document.removeEventListener("fullscreenchange", this.handleVisibilityChange);
        }
        async isSupported() {
          const result = {
            isSupported: this._isSupported
          };
          return result;
        }
        async isKeptAwake() {
          if (!this._isSupported) {
            this.throwUnsupportedError();
          }
          const result = {
            isKeptAwake: !!this.wakeLock
          };
          return result;
        }
        throwUnsupportedError() {
          throw this.unavailable("Screen Wake Lock API not available in this browser.");
        }
      };
    }
  });

  // apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/definitions.js
  var AppUpdateAvailability, FlexibleUpdateInstallStatus, AppUpdateResultCode;
  var init_definitions2 = __esm({
    "apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/definitions.js"() {
      (function(AppUpdateAvailability2) {
        AppUpdateAvailability2[AppUpdateAvailability2["UNKNOWN"] = 0] = "UNKNOWN";
        AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_NOT_AVAILABLE"] = 1] = "UPDATE_NOT_AVAILABLE";
        AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_AVAILABLE"] = 2] = "UPDATE_AVAILABLE";
        AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_IN_PROGRESS"] = 3] = "UPDATE_IN_PROGRESS";
      })(AppUpdateAvailability || (AppUpdateAvailability = {}));
      (function(FlexibleUpdateInstallStatus2) {
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["UNKNOWN"] = 0] = "UNKNOWN";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["PENDING"] = 1] = "PENDING";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADING"] = 2] = "DOWNLOADING";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLING"] = 3] = "INSTALLING";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLED"] = 4] = "INSTALLED";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["FAILED"] = 5] = "FAILED";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["CANCELED"] = 6] = "CANCELED";
        FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADED"] = 11] = "DOWNLOADED";
      })(FlexibleUpdateInstallStatus || (FlexibleUpdateInstallStatus = {}));
      (function(AppUpdateResultCode2) {
        AppUpdateResultCode2[AppUpdateResultCode2["OK"] = 0] = "OK";
        AppUpdateResultCode2[AppUpdateResultCode2["CANCELED"] = 1] = "CANCELED";
        AppUpdateResultCode2[AppUpdateResultCode2["FAILED"] = 2] = "FAILED";
        AppUpdateResultCode2[AppUpdateResultCode2["NOT_AVAILABLE"] = 3] = "NOT_AVAILABLE";
        AppUpdateResultCode2[AppUpdateResultCode2["NOT_ALLOWED"] = 4] = "NOT_ALLOWED";
        AppUpdateResultCode2[AppUpdateResultCode2["INFO_MISSING"] = 5] = "INFO_MISSING";
      })(AppUpdateResultCode || (AppUpdateResultCode = {}));
    }
  });

  // apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/web.js
  var web_exports6 = {};
  __export(web_exports6, {
    CapacitorUpdaterWeb: () => CapacitorUpdaterWeb
  });
  var BUNDLE_BUILTIN, CapacitorUpdaterWeb;
  var init_web6 = __esm({
    "apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/web.js"() {
      init_dist();
      init_definitions2();
      BUNDLE_BUILTIN = {
        status: "success",
        version: "",
        downloaded: "1970-01-01T00:00:00.000Z",
        id: "builtin",
        checksum: ""
      };
      CapacitorUpdaterWeb = class extends WebPlugin {
        async setStatsUrl(options) {
          console.warn("Cannot setStatsUrl in web", options);
          return;
        }
        async setUpdateUrl(options) {
          console.warn("Cannot setUpdateUrl in web", options);
          return;
        }
        async setChannelUrl(options) {
          console.warn("Cannot setChannelUrl in web", options);
          return;
        }
        async download(options) {
          console.warn("Cannot download version in web", options);
          return BUNDLE_BUILTIN;
        }
        async next(options) {
          console.warn("Cannot set next version in web", options);
          return BUNDLE_BUILTIN;
        }
        async isAutoUpdateEnabled() {
          console.warn("Cannot get isAutoUpdateEnabled in web");
          return { enabled: false };
        }
        async set(options) {
          console.warn("Cannot set active bundle in web", options);
          return;
        }
        async startPreviewSession(options) {
          console.warn("Cannot start preview session in web", options);
          return;
        }
        async listPreviews() {
          console.warn("Cannot list previews in web");
          return { previews: [], currentBundle: BUNDLE_BUILTIN };
        }
        async setPreview(options) {
          console.warn("Cannot set preview in web", options);
          return;
        }
        async resetPreview() {
          console.warn("Cannot reset preview in web");
          return;
        }
        async deletePreview(options) {
          console.warn("Cannot delete preview in web", options);
          return { removed: false, deleted: false };
        }
        async checkPreviewUpdate(options) {
          console.warn("Cannot check preview update in web", options);
          throw this.unimplemented("Preview updates are not available on web platform");
        }
        async updatePreview(options) {
          console.warn("Cannot update preview in web", options);
          throw this.unimplemented("Preview updates are not available on web platform");
        }
        async getDeviceId() {
          console.warn("Cannot get ID in web");
          return { deviceId: "default" };
        }
        async getBuiltinVersion() {
          console.warn("Cannot get version in web");
          return { version: "default" };
        }
        async getPluginVersion() {
          console.warn("Cannot get plugin version in web");
          return { version: "default" };
        }
        async delete(options) {
          console.warn("Cannot delete bundle in web", options);
        }
        async setBundleError(options) {
          console.warn("Cannot setBundleError in web", options);
          return BUNDLE_BUILTIN;
        }
        async list() {
          console.warn("Cannot list bundles in web");
          return { bundles: [] };
        }
        async reset(options) {
          console.warn("Cannot reset version in web", options);
        }
        async current() {
          console.warn("Cannot get current bundle in web");
          return { bundle: BUNDLE_BUILTIN, native: "0.0.0" };
        }
        async reload() {
          console.warn("Cannot reload current bundle in web");
          return;
        }
        async getLatest() {
          console.warn("Cannot getLatest current bundle in web");
          return {
            version: "0.0.0",
            message: "Cannot getLatest current bundle in web"
          };
        }
        async triggerUpdateCheck() {
          console.warn("Cannot triggerUpdateCheck in web");
          return { status: "unavailable", queued: false };
        }
        async getMissingBundleFiles(options) {
          var _a, _b, _c;
          console.warn("Cannot inspect missing bundle files in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
          const missing = (_c = options.manifest) !== null && _c !== void 0 ? _c : [];
          return {
            missing,
            total: missing.length,
            missingCount: missing.length,
            reusableCount: 0
          };
        }
        async getBundleDownloadSize(options) {
          var _a, _b, _c, _d, _e;
          console.warn("Cannot estimate bundle download size in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
          return {
            totalSize: 0,
            knownFiles: 0,
            unknownFiles: (_d = (_c = options.manifest) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0,
            files: ((_e = options.manifest) !== null && _e !== void 0 ? _e : []).map((entry) => ({
              file_name: entry.file_name,
              file_hash: entry.file_hash,
              download_url: entry.download_url,
              error: "unavailable"
            }))
          };
        }
        async setChannel(options) {
          console.warn("Cannot setChannel in web", options);
          return {
            status: "error",
            error: "Cannot setChannel in web"
          };
        }
        async unsetChannel(options) {
          console.warn("Cannot unsetChannel in web", options);
          return;
        }
        async setCustomId(options) {
          console.warn("Cannot setCustomId in web", options);
          return;
        }
        async getChannel() {
          console.warn("Cannot getChannel in web");
          return {
            status: "error",
            error: "Cannot getChannel in web"
          };
        }
        async listChannels() {
          console.warn("Cannot listChannels in web");
          throw {
            message: "Cannot listChannels in web",
            error: "platform_not_supported"
          };
        }
        async notifyAppReady() {
          return { bundle: BUNDLE_BUILTIN };
        }
        async setMultiDelay(options) {
          console.warn("Cannot setMultiDelay in web", options === null || options === void 0 ? void 0 : options.delayConditions);
          return;
        }
        async cancelDelay() {
          console.warn("Cannot cancelDelay in web");
          return;
        }
        async isAutoUpdateAvailable() {
          console.warn("Cannot isAutoUpdateAvailable in web");
          return { available: false };
        }
        async getCurrentBundle() {
          console.warn("Cannot get current bundle in web");
          return BUNDLE_BUILTIN;
        }
        async getNextBundle() {
          return Promise.resolve(null);
        }
        async getFailedUpdate() {
          console.warn("Cannot getFailedUpdate in web");
          return null;
        }
        async setShakeMenu(_options) {
          throw this.unimplemented("Shake menu not available on web platform");
        }
        async isShakeMenuEnabled() {
          return Promise.resolve({ enabled: false, gesture: "shake" });
        }
        async setShakeChannelSelector(_options) {
          throw this.unimplemented("Shake channel selector not available on web platform");
        }
        async isShakeChannelSelectorEnabled() {
          return Promise.resolve({ enabled: false });
        }
        async getAppId() {
          console.warn("Cannot getAppId in web");
          return { appId: "default" };
        }
        async setAppId(options) {
          console.warn("Cannot setAppId in web", options);
          return;
        }
        // ============================================================================
        // App Store / Play Store Update Methods (Web stubs)
        // ============================================================================
        async getAppUpdateInfo(_options) {
          console.warn("getAppUpdateInfo is not available on web platform");
          return {
            currentVersionName: "0.0.0",
            currentVersionCode: "0",
            updateAvailability: AppUpdateAvailability.UNKNOWN
          };
        }
        async openAppStore(_options) {
          throw this.unimplemented("openAppStore is not available on web platform");
        }
        async performImmediateUpdate() {
          throw this.unimplemented("performImmediateUpdate is only available on Android");
        }
        async startFlexibleUpdate() {
          throw this.unimplemented("startFlexibleUpdate is only available on Android");
        }
        async completeFlexibleUpdate() {
          throw this.unimplemented("completeFlexibleUpdate is only available on Android");
        }
      };
    }
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/definitions.js
  var ScanMode;
  (function(ScanMode2) {
    ScanMode2[ScanMode2["SCAN_MODE_LOW_POWER"] = 0] = "SCAN_MODE_LOW_POWER";
    ScanMode2[ScanMode2["SCAN_MODE_BALANCED"] = 1] = "SCAN_MODE_BALANCED";
    ScanMode2[ScanMode2["SCAN_MODE_LOW_LATENCY"] = 2] = "SCAN_MODE_LOW_LATENCY";
  })(ScanMode || (ScanMode = {}));
  var ConnectionPriority;
  (function(ConnectionPriority2) {
    ConnectionPriority2[ConnectionPriority2["CONNECTION_PRIORITY_BALANCED"] = 0] = "CONNECTION_PRIORITY_BALANCED";
    ConnectionPriority2[ConnectionPriority2["CONNECTION_PRIORITY_HIGH"] = 1] = "CONNECTION_PRIORITY_HIGH";
    ConnectionPriority2[ConnectionPriority2["CONNECTION_PRIORITY_LOW_POWER"] = 2] = "CONNECTION_PRIORITY_LOW_POWER";
  })(ConnectionPriority || (ConnectionPriority = {}));

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/bleClient.js
  init_dist();
  init_conversion();

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/plugin.js
  init_dist();
  var BluetoothLe = registerPlugin("BluetoothLe", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.BluetoothLeWeb())
  });

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/queue.js
  var makeQueue = () => {
    let currentTask = Promise.resolve();
    return (fn) => new Promise((resolve2, reject) => {
      currentTask = currentTask.then(() => fn()).then(resolve2).catch(reject);
    });
  };
  function getQueue(enabled) {
    if (enabled) {
      return makeQueue();
    }
    return (fn) => fn();
  }

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/validators.js
  function parseUUID(uuid) {
    if (typeof uuid !== "string") {
      throw new Error(`Invalid UUID type ${typeof uuid}. Expected string.`);
    }
    uuid = uuid.toLowerCase();
    const is128BitUuid = uuid.search(/^[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}$/) >= 0;
    if (!is128BitUuid) {
      throw new Error(`Invalid UUID format ${uuid}. Expected 128 bit string (e.g. "0000180d-0000-1000-8000-00805f9b34fb").`);
    }
    return uuid;
  }

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/bleClient.js
  var BleClientClass = class {
    constructor() {
      this.scanListener = null;
      this.eventListeners = /* @__PURE__ */ new Map();
      this.queue = getQueue(true);
    }
    enableQueue() {
      this.queue = getQueue(true);
    }
    disableQueue() {
      this.queue = getQueue(false);
    }
    async initialize(options) {
      await this.queue(async () => {
        await BluetoothLe.initialize(options);
      });
    }
    async isEnabled() {
      const enabled = await this.queue(async () => {
        const result = await BluetoothLe.isEnabled();
        return result.value;
      });
      return enabled;
    }
    async requestEnable() {
      await this.queue(async () => {
        await BluetoothLe.requestEnable();
      });
    }
    async enable() {
      await this.queue(async () => {
        await BluetoothLe.enable();
      });
    }
    async disable() {
      await this.queue(async () => {
        await BluetoothLe.disable();
      });
    }
    async startEnabledNotifications(callback) {
      await this.queue(async () => {
        var _a;
        const key = `onEnabledChanged`;
        await ((_a = this.eventListeners.get(key)) === null || _a === void 0 ? void 0 : _a.remove());
        const listener = await BluetoothLe.addListener(key, (result) => {
          callback(result.value);
        });
        this.eventListeners.set(key, listener);
        await BluetoothLe.startEnabledNotifications();
      });
    }
    async stopEnabledNotifications() {
      await this.queue(async () => {
        var _a;
        const key = `onEnabledChanged`;
        await ((_a = this.eventListeners.get(key)) === null || _a === void 0 ? void 0 : _a.remove());
        this.eventListeners.delete(key);
        await BluetoothLe.stopEnabledNotifications();
      });
    }
    async isLocationEnabled() {
      const enabled = await this.queue(async () => {
        const result = await BluetoothLe.isLocationEnabled();
        return result.value;
      });
      return enabled;
    }
    async openLocationSettings() {
      await this.queue(async () => {
        await BluetoothLe.openLocationSettings();
      });
    }
    async openBluetoothSettings() {
      await this.queue(async () => {
        await BluetoothLe.openBluetoothSettings();
      });
    }
    async openAppSettings() {
      await this.queue(async () => {
        await BluetoothLe.openAppSettings();
      });
    }
    async setDisplayStrings(displayStrings) {
      await this.queue(async () => {
        await BluetoothLe.setDisplayStrings(displayStrings);
      });
    }
    async requestDevice(options) {
      options = options ? this.validateRequestBleDeviceOptions(options) : void 0;
      const result = await this.queue(async () => {
        const device = await BluetoothLe.requestDevice(options);
        return device;
      });
      return result;
    }
    async requestLEScan(options, callback) {
      options = this.validateRequestBleDeviceOptions(options);
      await this.queue(async () => {
        var _a;
        await ((_a = this.scanListener) === null || _a === void 0 ? void 0 : _a.remove());
        this.scanListener = await BluetoothLe.addListener("onScanResult", (resultInternal) => {
          const result = Object.assign(Object.assign({}, resultInternal), { manufacturerData: this.convertObject(resultInternal.manufacturerData), serviceData: this.convertObject(resultInternal.serviceData), rawAdvertisement: resultInternal.rawAdvertisement ? this.convertValue(resultInternal.rawAdvertisement) : void 0 });
          callback(result);
        });
        await BluetoothLe.requestLEScan(options);
      });
    }
    async stopLEScan() {
      await this.queue(async () => {
        var _a;
        await ((_a = this.scanListener) === null || _a === void 0 ? void 0 : _a.remove());
        this.scanListener = null;
        await BluetoothLe.stopLEScan();
      });
    }
    async getDevices(deviceIds) {
      if (!Array.isArray(deviceIds)) {
        throw new Error("deviceIds must be an array");
      }
      return this.queue(async () => {
        const result = await BluetoothLe.getDevices({ deviceIds });
        return result.devices;
      });
    }
    async getConnectedDevices(services) {
      if (!Array.isArray(services)) {
        throw new Error("services must be an array");
      }
      services = services.map(parseUUID);
      return this.queue(async () => {
        const result = await BluetoothLe.getConnectedDevices({ services });
        return result.devices;
      });
    }
    async getBondedDevices() {
      return this.queue(async () => {
        const result = await BluetoothLe.getBondedDevices();
        return result.devices;
      });
    }
    async connect(deviceId, onDisconnect, options) {
      await this.queue(async () => {
        var _a;
        if (onDisconnect) {
          const key = `disconnected|${deviceId}`;
          await ((_a = this.eventListeners.get(key)) === null || _a === void 0 ? void 0 : _a.remove());
          const listener = await BluetoothLe.addListener(key, () => {
            onDisconnect(deviceId);
          });
          this.eventListeners.set(key, listener);
        }
        await BluetoothLe.connect(Object.assign({ deviceId }, options));
      });
    }
    async createBond(deviceId, options) {
      await this.queue(async () => {
        await BluetoothLe.createBond(Object.assign({ deviceId }, options));
      });
    }
    async isBonded(deviceId) {
      const isBonded = await this.queue(async () => {
        const result = await BluetoothLe.isBonded({ deviceId });
        return result.value;
      });
      return isBonded;
    }
    async disconnect(deviceId) {
      await this.queue(async () => {
        await BluetoothLe.disconnect({ deviceId });
      });
    }
    async getServices(deviceId) {
      const services = await this.queue(async () => {
        const result = await BluetoothLe.getServices({ deviceId });
        return result.services;
      });
      return services;
    }
    async discoverServices(deviceId) {
      await this.queue(async () => {
        await BluetoothLe.discoverServices({ deviceId });
      });
    }
    async getMtu(deviceId) {
      const value = await this.queue(async () => {
        const result = await BluetoothLe.getMtu({ deviceId });
        return result.value;
      });
      return value;
    }
    async requestConnectionPriority(deviceId, connectionPriority) {
      await this.queue(async () => {
        await BluetoothLe.requestConnectionPriority({ deviceId, connectionPriority });
      });
    }
    async readRssi(deviceId) {
      const value = await this.queue(async () => {
        const result = await BluetoothLe.readRssi({ deviceId });
        return parseFloat(result.value);
      });
      return value;
    }
    async read(deviceId, service, characteristic, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      const value = await this.queue(async () => {
        const result = await BluetoothLe.read(Object.assign({
          deviceId,
          service,
          characteristic
        }, options));
        return this.convertValue(result.value);
      });
      return value;
    }
    async write(deviceId, service, characteristic, value, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      return this.queue(async () => {
        if (!(value === null || value === void 0 ? void 0 : value.buffer)) {
          throw new Error("Invalid data.");
        }
        let writeValue = value;
        if (Capacitor.getPlatform() !== "web") {
          writeValue = dataViewToHexString(value);
        }
        await BluetoothLe.write(Object.assign({
          deviceId,
          service,
          characteristic,
          value: writeValue
        }, options));
      });
    }
    async writeWithoutResponse(deviceId, service, characteristic, value, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      await this.queue(async () => {
        if (!(value === null || value === void 0 ? void 0 : value.buffer)) {
          throw new Error("Invalid data.");
        }
        let writeValue = value;
        if (Capacitor.getPlatform() !== "web") {
          writeValue = dataViewToHexString(value);
        }
        await BluetoothLe.writeWithoutResponse(Object.assign({
          deviceId,
          service,
          characteristic,
          value: writeValue
        }, options));
      });
    }
    async readDescriptor(deviceId, service, characteristic, descriptor, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      descriptor = parseUUID(descriptor);
      const value = await this.queue(async () => {
        const result = await BluetoothLe.readDescriptor(Object.assign({
          deviceId,
          service,
          characteristic,
          descriptor
        }, options));
        return this.convertValue(result.value);
      });
      return value;
    }
    async writeDescriptor(deviceId, service, characteristic, descriptor, value, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      descriptor = parseUUID(descriptor);
      return this.queue(async () => {
        if (!(value === null || value === void 0 ? void 0 : value.buffer)) {
          throw new Error("Invalid data.");
        }
        let writeValue = value;
        if (Capacitor.getPlatform() !== "web") {
          writeValue = dataViewToHexString(value);
        }
        await BluetoothLe.writeDescriptor(Object.assign({
          deviceId,
          service,
          characteristic,
          descriptor,
          value: writeValue
        }, options));
      });
    }
    async startNotifications(deviceId, service, characteristic, callback, options) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      await this.queue(async () => {
        var _a;
        const key = `notification|${deviceId}|${service}|${characteristic}`;
        await ((_a = this.eventListeners.get(key)) === null || _a === void 0 ? void 0 : _a.remove());
        const listener = await BluetoothLe.addListener(key, (event) => {
          callback(this.convertValue(event === null || event === void 0 ? void 0 : event.value));
        });
        this.eventListeners.set(key, listener);
        await BluetoothLe.startNotifications(Object.assign({
          deviceId,
          service,
          characteristic
        }, options));
      });
    }
    async stopNotifications(deviceId, service, characteristic) {
      service = parseUUID(service);
      characteristic = parseUUID(characteristic);
      await this.queue(async () => {
        var _a;
        const key = `notification|${deviceId}|${service}|${characteristic}`;
        await ((_a = this.eventListeners.get(key)) === null || _a === void 0 ? void 0 : _a.remove());
        this.eventListeners.delete(key);
        await BluetoothLe.stopNotifications({
          deviceId,
          service,
          characteristic
        });
      });
    }
    validateRequestBleDeviceOptions(options) {
      options = Object.assign({}, options);
      if (options.services) {
        options.services = options.services.map(parseUUID);
      }
      if (options.optionalServices) {
        options.optionalServices = options.optionalServices.map(parseUUID);
      }
      if (options.serviceData && Capacitor.getPlatform() !== "web") {
        options.serviceData = options.serviceData.map((filter) => Object.assign(Object.assign({}, filter), { serviceUuid: parseUUID(filter.serviceUuid), dataPrefix: toHexString(filter.dataPrefix), mask: toHexString(filter.mask) }));
      }
      if (options.manufacturerData) {
        if (Capacitor.getPlatform() !== "web") {
          options.manufacturerData = options.manufacturerData.map((filter) => Object.assign(Object.assign({}, filter), { dataPrefix: toHexString(filter.dataPrefix), mask: toHexString(filter.mask) }));
        } else {
          options.manufacturerData = options.manufacturerData.map((filter) => Object.assign(Object.assign({}, filter), { dataPrefix: toUint8Array(filter.dataPrefix), mask: toUint8Array(filter.mask) }));
        }
      }
      return options;
    }
    convertValue(value) {
      if (typeof value === "string") {
        return hexStringToDataView(value);
      } else if (value === void 0) {
        return new DataView(new ArrayBuffer(0));
      }
      return value;
    }
    convertObject(obj) {
      if (obj === void 0) {
        return void 0;
      }
      const result = {};
      for (const key of Object.keys(obj)) {
        result[key] = this.convertValue(obj[key]);
      }
      return result;
    }
  };
  var BleClient = new BleClientClass();

  // apps/mobile/capacitor/node_modules/@capacitor-community/bluetooth-le/dist/esm/index.js
  init_conversion();

  // apps/mobile/capacitor/node_modules/@capacitor/browser/dist/esm/index.js
  init_dist();
  var Browser2 = registerPlugin("Browser", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.BrowserWeb())
  });

  // apps/mobile/capacitor/node_modules/@capacitor/app/dist/esm/index.js
  init_dist();
  var App = registerPlugin("App", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.AppWeb())
  });

  // apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // apps/mobile/capacitor/node_modules/@capacitor/synapse/dist/synapse.mjs
  function s(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return new Proxy({}, {
            get(w, o) {
              return (c, p, r) => {
                const i = t.Capacitor.Plugins[n];
                if (i === void 0) {
                  r(new Error(`Capacitor plugin ${n} not found`));
                  return;
                }
                if (typeof i[o] != "function") {
                  r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                  return;
                }
                (async () => {
                  try {
                    const a = await i[o](c);
                    p(a);
                  } catch (a) {
                    r(a);
                  }
                })();
              };
            }
          });
        }
      }
    );
  }
  function u(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return t.cordova.plugins[n];
        }
      }
    );
  }
  function f(t = false) {
    typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
  }

  // apps/mobile/capacitor/node_modules/@capacitor/filesystem/dist/esm/index.js
  init_definitions();
  var Filesystem = registerPlugin("Filesystem", {
    web: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.FilesystemWeb())
  });
  f();

  // apps/mobile/capacitor/node_modules/@capacitor-community/keep-awake/dist/esm/index.js
  init_dist();
  var KeepAwake = registerPlugin("KeepAwake", {
    web: () => Promise.resolve().then(() => (init_web5(), web_exports5)).then((m) => new m.KeepAwakeWeb())
  });

  // apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/index.js
  init_dist();

  // apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/history.js
  var KEEP_FLAG_KEY = "__capgo_keep_url_path_after_reload";
  var HISTORY_STORAGE_KEY = "__capgo_history_stack__";
  var MAX_STACK_ENTRIES = 100;
  var isBrowser = typeof window !== "undefined" && typeof document !== "undefined" && typeof history !== "undefined";
  if (isBrowser) {
    const win = window;
    if (!win.__capgoHistoryPatched) {
      win.__capgoHistoryPatched = true;
      const isFeatureConfigured = () => {
        try {
          if (win.__capgoKeepUrlPathAfterReload) {
            return true;
          }
        } catch (_a) {
        }
        try {
          return window.localStorage.getItem(KEEP_FLAG_KEY) === "1";
        } catch (_b) {
          return false;
        }
      };
      const readStored = () => {
        try {
          const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY);
          if (!raw) {
            return { stack: [], index: -1 };
          }
          const parsed = JSON.parse(raw);
          if (!parsed || !Array.isArray(parsed.stack) || typeof parsed.index !== "number") {
            return { stack: [], index: -1 };
          }
          return parsed;
        } catch (_a) {
          return { stack: [], index: -1 };
        }
      };
      const writeStored = (stack, index) => {
        try {
          window.sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ stack, index }));
        } catch (_a) {
        }
      };
      const clearStored = () => {
        try {
          window.sessionStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (_a) {
        }
      };
      const normalize = (url) => {
        try {
          const base = url !== null && url !== void 0 ? url : window.location.href;
          const parsed = new URL(base instanceof URL ? base.toString() : base, window.location.href);
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch (_a) {
          return null;
        }
      };
      const trimStack = (stack, index) => {
        if (stack.length <= MAX_STACK_ENTRIES) {
          return { stack, index };
        }
        const start = stack.length - MAX_STACK_ENTRIES;
        const trimmed = stack.slice(start);
        const adjustedIndex = Math.max(0, index - start);
        return { stack: trimmed, index: adjustedIndex };
      };
      const runWhenReady = (fn) => {
        if (document.readyState === "complete" || document.readyState === "interactive") {
          fn();
        } else {
          window.addEventListener("DOMContentLoaded", fn, { once: true });
        }
      };
      let featureActive = false;
      let isRestoring = false;
      let restoreScheduled = false;
      const ensureCurrentTracked = () => {
        if (!featureActive) {
          return;
        }
        const stored = readStored();
        const current = normalize();
        if (!current) {
          return;
        }
        if (stored.stack.length === 0) {
          stored.stack.push(current);
          stored.index = 0;
          writeStored(stored.stack, stored.index);
          return;
        }
        if (stored.index < 0 || stored.index >= stored.stack.length) {
          stored.index = stored.stack.length - 1;
        }
        if (stored.stack[stored.index] !== current) {
          stored.stack[stored.index] = current;
          writeStored(stored.stack, stored.index);
        }
      };
      const record = (url, replace) => {
        if (!featureActive || isRestoring) {
          return;
        }
        const normalized = normalize(url);
        if (!normalized) {
          return;
        }
        let { stack, index } = readStored();
        if (stack.length === 0) {
          stack.push(normalized);
          index = stack.length - 1;
        } else if (replace) {
          if (index < 0 || index >= stack.length) {
            index = stack.length - 1;
          }
          stack[index] = normalized;
        } else {
          if (index >= stack.length - 1) {
            stack.push(normalized);
            index = stack.length - 1;
          } else {
            stack = stack.slice(0, index + 1);
            stack.push(normalized);
            index = stack.length - 1;
          }
        }
        ({ stack, index } = trimStack(stack, index));
        writeStored(stack, index);
      };
      const restoreHistory = () => {
        if (!featureActive || isRestoring) {
          return;
        }
        const stored = readStored();
        if (stored.stack.length === 0) {
          ensureCurrentTracked();
          return;
        }
        const targetIndex = stored.index >= 0 && stored.index < stored.stack.length ? stored.index : stored.stack.length - 1;
        const normalizedCurrent = normalize();
        if (stored.stack.length === 1 && normalizedCurrent === stored.stack[0]) {
          return;
        }
        const firstEntry = stored.stack[0];
        if (!firstEntry) {
          return;
        }
        isRestoring = true;
        try {
          history.replaceState(history.state, document.title, firstEntry);
          for (let i = 1; i < stored.stack.length; i += 1) {
            history.pushState(history.state, document.title, stored.stack[i]);
          }
        } catch (_a) {
          isRestoring = false;
          return;
        }
        isRestoring = false;
        const currentIndex = stored.stack.length - 1;
        const offset = targetIndex - currentIndex;
        if (offset !== 0) {
          history.go(offset);
        } else {
          history.replaceState(history.state, document.title, stored.stack[targetIndex]);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      };
      const scheduleRestore = () => {
        if (!featureActive || restoreScheduled) {
          return;
        }
        restoreScheduled = true;
        runWhenReady(() => {
          restoreScheduled = false;
          restoreHistory();
        });
      };
      let originalPushState = null;
      let originalReplaceState = null;
      const popstateHandler = () => {
        if (!featureActive || isRestoring) {
          return;
        }
        const normalized = normalize();
        if (!normalized) {
          return;
        }
        const stored = readStored();
        const idx = stored.stack.lastIndexOf(normalized);
        if (idx >= 0) {
          stored.index = idx;
        } else {
          stored.stack.push(normalized);
          stored.index = stored.stack.length - 1;
        }
        const trimmed = trimStack(stored.stack, stored.index);
        writeStored(trimmed.stack, trimmed.index);
      };
      const patchHistory = () => {
        if (originalPushState && originalReplaceState) {
          return;
        }
        originalPushState = history.pushState;
        originalReplaceState = history.replaceState;
        history.pushState = function pushStatePatched(state, title, url) {
          const result = originalPushState === null || originalPushState === void 0 ? void 0 : originalPushState.call(history, state, title, url);
          record(url, false);
          return result;
        };
        history.replaceState = function replaceStatePatched(state, title, url) {
          const result = originalReplaceState === null || originalReplaceState === void 0 ? void 0 : originalReplaceState.call(history, state, title, url);
          record(url, true);
          return result;
        };
        window.addEventListener("popstate", popstateHandler);
      };
      const unpatchHistory = () => {
        if (originalPushState) {
          history.pushState = originalPushState;
          originalPushState = null;
        }
        if (originalReplaceState) {
          history.replaceState = originalReplaceState;
          originalReplaceState = null;
        }
        window.removeEventListener("popstate", popstateHandler);
      };
      const setFeatureActive = (enabled) => {
        if (featureActive === enabled) {
          if (featureActive) {
            ensureCurrentTracked();
            scheduleRestore();
          }
          return;
        }
        featureActive = enabled;
        if (featureActive) {
          patchHistory();
          ensureCurrentTracked();
          scheduleRestore();
        } else {
          unpatchHistory();
          clearStored();
        }
      };
      window.addEventListener("CapacitorUpdaterKeepUrlPathAfterReload", (event) => {
        var _a;
        const evt = event;
        const enabled = (_a = evt === null || evt === void 0 ? void 0 : evt.detail) === null || _a === void 0 ? void 0 : _a.enabled;
        if (typeof enabled === "boolean") {
          win.__capgoKeepUrlPathAfterReload = enabled;
          setFeatureActive(enabled);
        } else {
          win.__capgoKeepUrlPathAfterReload = true;
          setFeatureActive(true);
        }
      });
      setFeatureActive(isFeatureConfigured());
    }
  }

  // apps/mobile/capacitor/node_modules/@capgo/capacitor-updater/dist/esm/index.js
  init_definitions2();
  var CapacitorUpdater = registerPlugin("CapacitorUpdater", {
    web: () => Promise.resolve().then(() => (init_web6(), web_exports6)).then((m) => new m.CapacitorUpdaterWeb())
  });

  // apps/mobile/capacitor/engine-native-entry.js
  init_dist();
  window.EngineNative = { BleClient, Browser: Browser2, App, Filesystem, Directory, KeepAwake, Capacitor, CapacitorUpdater, WorkoutService: registerPlugin("WorkoutService") };
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
