/* Totem-lite WHOOP iOS API — Cognito + home / recovery / strain (includes steps). */
(function (global) {
  const BASE = 'https://api.prod.whoop.com';
  const COGNITO = BASE + '/auth-service/v3/whoop/';
  const API_VERSION = '7';
  const USER_AGENT =
    'aws-sdk-swift/1.5.86 ua/2.1 api/cognito_identity_provider#1.5.86 os/ios#26.3.1 lang/swift#5.10 m/D,N,Z,b';
  const IOS_APP_VERSION = '5.52.0';
  const IOS_BUILD_NUMBER = '595097';

  function asObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  }
  function asArray(v) {
    return Array.isArray(v) ? v : [];
  }
  function asString(v) {
    return typeof v === 'string' && v.trim() ? v : null;
  }
  function parseNumber(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = parseFloat(String(v).replace(/[,%]/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }
  function walkItems(node, out) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((n) => walkItems(n, out));
      return;
    }
    if (typeof node.type === 'string' && asObject(node.content)) {
      out.push({ type: node.type, content: node.content });
    }
    Object.keys(node).forEach((k) => walkItems(node[k], out));
  }
  function findContributor(metrics, suffix) {
    const needle = String(suffix || '').toUpperCase();
    for (let i = 0; i < metrics.length; i += 1) {
      const m = asObject(metrics[i]);
      if (!m) continue;
      const id = asString(m.id);
      if (id && id.toUpperCase().endsWith(needle)) return m;
    }
    return null;
  }
  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID().toUpperCase();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }).toUpperCase();
  }
  function newInstallationId() {
    return uuid();
  }
  function deviceHeaders(installationId) {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
    return {
      'user-agent': 'iOS',
      'x-whoop-device-platform': 'iOS',
      'x-whoop-ios-version': IOS_APP_VERSION,
      'x-whoop-ios-build-number': IOS_BUILD_NUMBER,
      'x-whoop-bundle-name': 'com.whoop.iphone',
      'x-whoop-installation-identifier': installationId || newInstallationId(),
      'x-whoop-time-zone': tz,
      'x-whoop-clock-format': 'TWELVE_HOUR',
      currency: 'USD',
      locale: 'en_US',
      'accept-language': 'en',
      accept: '*/*',
    };
  }
  function decodeJwtExp(jwt) {
    const parts = String(jwt || '').split('.');
    if (parts.length < 2) return 0;
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const json = (typeof Buffer !== 'undefined')
        ? Buffer.from(padded, 'base64').toString('utf8')
        : global.atob(padded);
      const payload = JSON.parse(json);
      return Number(payload.exp) || 0;
    } catch (_) {
      return 0;
    }
  }
  function tokensFromAuth(ar, fallbackRefresh) {
    const access = ar && ar.AccessToken;
    const expSec = decodeJwtExp(access);
    return {
      accessToken: access,
      refreshToken: (ar && ar.RefreshToken) || fallbackRefresh || '',
      idToken: (ar && ar.IdToken) || '',
      expiresAt: expSec ? expSec * 1000 : Date.now() + ((ar && ar.ExpiresIn) || 3600) * 1000,
    };
  }
  async function httpRequest(url, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const headers = opts.headers || {};
    const body = opts.body;
    const CapHttp = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.CapacitorHttp;
    if (CapHttp && typeof CapHttp.request === 'function') {
      let data = body;
      if (typeof body === 'string') {
        try { data = JSON.parse(body); } catch (_) { data = body; }
      }
      const nativeHeaders = Object.assign({
        'User-Agent': headers['user-agent'] || headers['User-Agent'] || USER_AGENT,
        'x-cap-user-agent': headers['user-agent'] || headers['User-Agent'] || USER_AGENT,
      }, headers);
      const res = await CapHttp.request({
        url: String(url),
        method,
        headers: nativeHeaders,
        data,
        dataType: typeof data === 'string' ? 'text' : undefined,
        connectTimeout: 30000,
        readTimeout: 30000,
        disableRedirects: true,
      });
      const payload = res && res.data;
      const text = typeof payload === 'string' ? payload : (payload == null ? '' : JSON.stringify(payload));
      const status = Number(res && res.status) || 0;
      return { status, ok: status >= 200 && status < 300, text };
    }
    const fetchFn = global.fetch;
    if (typeof fetchFn !== 'function') throw new Error('WHOOP fetch unavailable');
    const res = await fetchFn(String(url), {
      method,
      headers,
      body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
      cache: 'no-store',
    });
    return { status: res.status, ok: !!res.ok, text: await res.text() };
  }
  function parseBody(text) {
    if (!text) return {};
    try { return JSON.parse(text); } catch (_) { return { raw: text }; }
  }
  function cognitoErrorMessage(parsed, fallback, email) {
    const type = String((parsed && parsed.__type) || '');
    const msg = String((parsed && parsed.message) || fallback || '');
    const blob = (type + ' ' + msg).toLowerCase();
    if (/notauthorized|incorrect username|incorrect password|user not found/.test(blob)) {
      const who = email ? (' for ' + email) : '';
      return 'WHOOP rejected the password' + who + '. Use the password that opens the WHOOP app — not HYBRID S&C. Apple or Google WHOOP sign-in will not work here.';
    }
    if (/passwordresetrequired/.test(blob)) {
      return 'Reset your password in the WHOOP app, then connect here';
    }
    if (/usernotconfirmed/.test(blob)) {
      return 'Confirm your WHOOP email in the WHOOP app, then connect here';
    }
    if (/code mismatch|expiredcode|invalid.*code/.test(blob)) {
      return 'That WHOOP code is wrong or expired — try again';
    }
    if (/limitexceeded|toomanyrequests|attempt/.test(blob)) {
      return 'WHOOP locked the login for a minute — wait and try again';
    }
    return msg ? ('WHOOP login failed: ' + (type || msg)) : 'WHOOP login failed';
  }
  async function callCognito(target, body) {
    const res = await httpRequest(COGNITO, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': 'AWSCognitoIdentityProviderService.' + target,
        'amz-sdk-request': 'attempt=1; max=1',
        'amz-sdk-invocation-id': uuid(),
        'user-agent': USER_AGENT,
        accept: '*/*',
      },
      body: JSON.stringify(body),
    });
    const parsed = parseBody(res.text);
    if (!res.ok) {
      const e = new Error(cognitoErrorMessage(parsed, parsed.error || res.text.slice(0, 160), body && body.AuthParameters && body.AuthParameters.USERNAME));
      e.status = res.status;
      e.body = parsed;
      throw e;
    }
    return parsed;
  }
  async function login(input) {
    input = input || {};
    const email = String(input.email || '').trim();
    const init = await callCognito('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email, PASSWORD: input.password },
      ClientId: '',
    });
    if (init.AuthenticationResult) return tokensFromAuth(init.AuthenticationResult);
    if (init.ChallengeName && init.Session) {
      return { challenge: init.ChallengeName, session: init.Session, email: email };
    }
    throw new Error('WHOOP login did not return tokens');
  }
  async function verifyMfa(input) {
    input = input || {};
    const challenge = input.challenge || 'SMS_MFA';
    const codeKey = challenge === 'SOFTWARE_TOKEN_MFA'
      ? 'SOFTWARE_TOKEN_MFA_CODE'
      : (challenge === 'EMAIL_OTP' ? 'EMAIL_OTP_CODE' : 'SMS_MFA_CODE');
    const resp = await callCognito('RespondToAuthChallenge', {
      ClientId: '',
      ChallengeName: challenge,
      Session: input.session,
      ChallengeResponses: {
        USERNAME: String(input.email || '').trim(),
        [codeKey]: String(input.code || '').trim(),
      },
    });
    if (!resp.AuthenticationResult) throw new Error('WHOOP code did not verify');
    return tokensFromAuth(resp.AuthenticationResult);
  }
  async function refresh(refreshToken) {
    const resp = await callCognito('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: refreshToken },
      ClientId: '',
    });
    if (!resp.AuthenticationResult) throw new Error('WHOOP session expired — connect again');
    return tokensFromAuth(resp.AuthenticationResult, refreshToken);
  }
  function projectTodaySnapshot(input) {
    input = input || {};
    const items = [];
    walkItems(input.home, items);
    walkItems(input.recovery, items);
    walkItems(input.strain, items);
    const sticky = items.find((it) => it.type === 'SCORE_GAUGE_STICKY');
    const gauges = sticky ? asArray(sticky.content.gauges) : [];
    function gaugeScore(title) {
      const g = gauges.find((row) => asObject(row) && asString(row.title) === title);
      return g ? parseNumber(g.score_display) : null;
    }
    const recGauge = items.find((it) => it.type === 'SCORE_GAUGE' && asString(it.content.id) === 'RECOVERY_SCORE_GAUGE');
    const strainGauge = items.find((it) => it.type === 'SCORE_GAUGE' && asString(it.content.id) === 'STRAIN_SCORE_GAUGE');
    const recTile = items.find((it) => it.type === 'CONTRIBUTORS_TILE' && asString(it.content.id) === 'RECOVERY_CONTRIBUTORS_TILE');
    const strainTile = items.find((it) => it.type === 'CONTRIBUTORS_TILE' && asString(it.content.id) === 'STRAIN_CONTRIBUTORS_TILE');
    const recMetrics = recTile ? asArray(recTile.content.metrics) : [];
    const strainMetrics = strainTile ? asArray(strainTile.content.metrics) : [];
    const hrv = findContributor(recMetrics, 'HRV');
    const rhr = findContributor(recMetrics, 'RHR');
    const steps = findContributor(strainMetrics, 'STEPS');
    return {
      date: input.date || null,
      recoveryScore: parseNumber(recGauge && recGauge.content.score_display) ?? gaugeScore('RECOVERY'),
      sleepPerformance: gaugeScore('SLEEP'),
      strain: parseNumber(strainGauge && strainGauge.content.score_display) ?? gaugeScore('STRAIN'),
      steps: parseNumber(steps && steps.status),
      hrvMs: parseNumber(hrv && hrv.status),
      restingHr: parseNumber(rhr && rhr.status),
      capturedAt: new Date().toISOString(),
    };
  }
  function todayIso() {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
  }
  async function getJson(path, query, token, installationId) {
    const url = new URL(BASE + path);
    url.searchParams.set('apiVersion', API_VERSION);
    Object.keys(query || {}).forEach((k) => {
      if (query[k] != null && query[k] !== '') url.searchParams.set(k, String(query[k]));
    });
    const res = await httpRequest(url.toString(), {
      method: 'GET',
      headers: Object.assign(deviceHeaders(installationId), {
        authorization: 'Bearer ' + token,
      }),
    });
    if (res.status === 401) {
      const e = new Error('WHOOP session expired — connect again');
      e.code = 'whoop_auth_expired';
      throw e;
    }
    if (!res.ok) {
      const e = new Error('WHOOP request failed (' + res.status + ')');
      e.status = res.status;
      throw e;
    }
    return parseBody(res.text);
  }
  async function syncToday(session) {
    session = session || {};
    const date = session.date || todayIso();
    const token = session.accessToken;
    const install = session.installationId || newInstallationId();
    if (!token) throw new Error('WHOOP is not connected');
    const [home, recovery, strain] = await Promise.all([
      getJson('/home-service/v1/home', { date }, token, install),
      getJson('/home-service/v1/deep-dive/recovery', { date }, token, install).catch(() => null),
      getJson('/home-service/v1/deep-dive/strain', { date }, token, install).catch(() => null),
    ]);
    return projectTodaySnapshot({ home, recovery, strain, date });
  }

  const api = {
    login,
    verifyMfa,
    refresh,
    syncToday,
    projectTodaySnapshot,
    deviceHeaders,
    newInstallationId,
    todayIso,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.WhoopIos = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
