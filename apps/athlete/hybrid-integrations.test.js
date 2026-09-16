import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));

function loadIntegrations() {
  const store = {};
  globalThis.localStorage = {
    getItem(k) { return store[k] ?? null; },
    setItem(k, v) { store[k] = v; },
  };
  require(join(root, 'hybrid-integrations.js'));
  return { H: globalThis.HybridIntegrations, store };
}

test('mergeIntoState copies shared whoop into house state', () => {
  const { H, store } = loadIntegrations();
  store['HYBRID_SC_integrations_v1'] = JSON.stringify({
    whoop: { connected: true, lastSyncAt: '2026-09-15T10:00:00Z', email: 'a@b.com' },
    checkin: { '2026-09-15': { whoopRecovery: 72, whoopStrain: 8.4 } },
  });
  const S = { settings: { whoop: { connected: false } }, checkin: {} };
  H.mergeIntoState(S);
  assert.equal(S.settings.whoop.connected, true);
  assert.equal(S.settings.whoop.email, 'a@b.com');
  assert.equal(S.checkin['2026-09-15'].whoopRecovery, 72);
  assert.equal(S.checkin['2026-09-15'].whoopStrain, 8.4);
});

test('persistWhoop writes whoop + checkin fields for today', () => {
  const { H, store } = loadIntegrations();
  const S = {
    settings: { whoop: { connected: true, lastSyncAt: '2026-09-15T11:00:00Z' } },
    checkin: {
      '2026-09-15': {
        whoopRecovery: 80,
        whoopStrain: 9.1,
        hrv: 55,
        restingHr: 48,
        whoopSleepPerformance: 85,
        whoopSteps: 10616,
        whoopSyncedAt: '2026-09-15T11:00:00Z',
        whoopSampleDate: '2026-09-15',
      },
    },
  };
  H.persistWhoop(S, '2026-09-15');
  const shared = JSON.parse(store['HYBRID_SC_integrations_v1']);
  assert.equal(shared.whoop.connected, true);
  assert.equal(shared.checkin['2026-09-15'].whoopRecovery, 80);
  assert.equal(shared.checkin['2026-09-15'].whoopStrain, 9.1);
  assert.equal(shared.checkin['2026-09-15'].whoopSleepPerformance, 85);
  assert.equal(shared.checkin['2026-09-15'].whoopSteps, undefined);
});
