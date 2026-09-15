import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));

function loadIos(fetchImpl) {
  globalThis.fetch = fetchImpl || (async () => { throw new Error('fetch not stubbed'); });
  if (!globalThis.WhoopIos) require(join(root, 'whoop-ios.js'));
  return globalThis.WhoopIos;
}

const homeFixture = {
  sections: [{
    items: [{
      type: 'SCORE_GAUGE_STICKY',
      content: {
        gauges: [
          { title: 'SLEEP', score_display: '88' },
          { title: 'RECOVERY', score_display: '72', progress_fill_style: 'RECOVERY_HIGH' },
          { title: 'STRAIN', score_display: '9.4' },
        ],
      },
    }],
  }],
};

const recoveryFixture = {
  sections: [{
    items: [
      { type: 'SCORE_GAUGE', content: { id: 'RECOVERY_SCORE_GAUGE', score_display: '72' } },
      {
        type: 'CONTRIBUTORS_TILE',
        content: {
          id: 'RECOVERY_CONTRIBUTORS_TILE',
          metrics: [
            { id: 'CONTRIBUTORS_TILE_HRV', status: '54' },
            { id: 'CONTRIBUTORS_TILE_RHR', status: '49' },
          ],
        },
      },
    ],
  }],
};

const strainFixture = {
  sections: [{
    items: [
      { type: 'SCORE_GAUGE', content: { id: 'STRAIN_SCORE_GAUGE', score_display: '9.4' } },
      {
        type: 'CONTRIBUTORS_TILE',
        content: {
          id: 'STRAIN_CONTRIBUTORS_TILE',
          metrics: [
            { id: 'CONTRIBUTORS_TILE_STEPS', status: '10,616' },
          ],
        },
      },
    ],
  }],
};

test('projectTodaySnapshot pulls sleep / recovery / strain / steps / HRV / RHR', () => {
  const Ios = loadIos();
  const n = Ios.projectTodaySnapshot({
    home: homeFixture,
    recovery: recoveryFixture,
    strain: strainFixture,
    date: '2026-09-15',
  });
  assert.equal(n.date, '2026-09-15');
  assert.equal(n.recoveryScore, 72);
  assert.equal(n.sleepPerformance, 88);
  assert.equal(n.strain, 9.4);
  assert.equal(n.steps, 10616);
  assert.equal(n.hrvMs, 54);
  assert.equal(n.restingHr, 49);
});

test('cognito login without MFA returns tokens', async () => {
  const Ios = loadIos(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      AuthenticationResult: {
        AccessToken: 'aaa.e30.sig',
        RefreshToken: 'refresh-1',
        IdToken: 'id-1',
        ExpiresIn: 3600,
        TokenType: 'Bearer',
      },
    }),
  }));
  const tokens = await Ios.login({ email: 'a@b.com', password: 'secret' });
  assert.equal(tokens.accessToken, 'aaa.e30.sig');
  assert.equal(tokens.refreshToken, 'refresh-1');
});

test('cognito login with SMS MFA returns challenge', async () => {
  const Ios = loadIos(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      ChallengeName: 'SMS_MFA',
      Session: 'sess-1',
    }),
  }));
  const out = await Ios.login({ email: 'a@b.com', password: 'secret' });
  assert.equal(out.challenge, 'SMS_MFA');
  assert.equal(out.session, 'sess-1');
});

test('cognito MFA verify returns tokens', async () => {
  const Ios = loadIos(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      AuthenticationResult: {
        AccessToken: 'tok-2',
        RefreshToken: 'refresh-2',
        IdToken: 'id-2',
        ExpiresIn: 3600,
        TokenType: 'Bearer',
      },
    }),
  }));
  const tokens = await Ios.verifyMfa({
    email: 'a@b.com',
    session: 'sess-1',
    challenge: 'SMS_MFA',
    code: '123456',
  });
  assert.equal(tokens.accessToken, 'tok-2');
});

test('syncToday GETs home + recovery + strain with iOS device headers', async () => {
  const seen = [];
  const Ios = loadIos(async (url, opts) => {
    seen.push({ url: String(url), headers: opts.headers, method: opts.method });
    const path = String(url);
    let body = homeFixture;
    if (path.includes('deep-dive/recovery')) body = recoveryFixture;
    if (path.includes('deep-dive/strain')) body = strainFixture;
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  });
  const n = await Ios.syncToday({
    accessToken: 'tok',
    installationId: 'AAAA-BBBB',
    date: '2026-09-15',
  });
  assert.equal(seen.length, 3);
  assert.ok(seen.every((r) => r.headers.authorization === 'Bearer tok'));
  assert.ok(seen.every((r) => r.headers['x-whoop-device-platform'] === 'iOS'));
  assert.ok(seen.every((r) => r.headers['x-whoop-installation-identifier'] === 'AAAA-BBBB'));
  assert.ok(seen.every((r) => String(r.url).includes('apiVersion=7')));
  assert.equal(n.steps, 10616);
  assert.equal(n.recoveryScore, 72);
});
