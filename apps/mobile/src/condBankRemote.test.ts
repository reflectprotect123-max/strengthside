import {
  FEED_COND_WEEK_KEY,
  pullCondBankRemote,
  pushCondBankRemote,
  type RemoteSyncResult,
} from './condBankRemote';
import type { CondWeek, StoredCondBank } from './condBankStorage';
import { clampCondWeek } from './condBankStorage';

function makeSb(handlers: {
  session?: { user: { id: string } } | null;
  appState?: { state: Record<string, unknown> } | null;
  appStateError?: { message: string } | null;
  upsertAppError?: { message: string } | null;
  feed?: { payload: Record<string, unknown> } | null;
  feedError?: { message: string } | null;
}) {
  const uid = handlers.session?.user?.id ?? null;
  return {
    auth: {
      getSession: async () => ({
        data: { session: handlers.session === undefined ? { user: { id: 'user-1' } } : handlers.session },
      }),
    },
    from: (table: string) => {
      if (table === 'app_state') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: handlers.appState === undefined ? { state: {} } : handlers.appState,
                error: handlers.appStateError ?? null,
              }),
            }),
          }),
          upsert: async () => ({ error: handlers.upsertAppError ?? null }),
        };
      }
      if (table === 'athlete_feed') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: handlers.feed === undefined ? { payload: {} } : handlers.feed,
                error: null,
              }),
            }),
          }),
          upsert: async () => ({ error: handlers.feedError ?? null }),
        };
      }
      throw new Error(`unexpected table ${table} uid=${uid}`);
    },
  };
}

jest.mock('./supabase', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = jest.requireMock('./supabase') as { getSupabase: jest.Mock };

const sample: CondWeek = {
  low: { banked: 43, target: 90 },
  mod: { banked: 28, target: 60 },
  high: { banked: 14, target: 30 },
};

const payload: StoredCondBank = {
  athlete: 'dan veldman',
  weekId: 'W1',
  conditioning: sample,
};

describe('condBankRemote', () => {
  beforeEach(() => {
    getSupabase.mockReset();
  });

  it('skips when supabase is not configured', async () => {
    getSupabase.mockReturnValue(null);
    expect(await pullCondBankRemote('dan veldman', 'W1')).toEqual({
      status: 'skipped',
      reason: 'supabase-not-configured',
    });
    expect(await pushCondBankRemote(payload)).toEqual({
      status: 'skipped',
      reason: 'supabase-not-configured',
    });
  });

  it('skips when the user is not signed in', async () => {
    getSupabase.mockReturnValue(makeSb({ session: null }));
    expect(await pullCondBankRemote('dan veldman', 'W1')).toMatchObject({
      status: 'skipped',
      reason: 'not-signed-in',
    });
  });

  it('loads a matching remote week bank from app_state', async () => {
    getSupabase.mockReturnValue(
      makeSb({
        appState: {
          state: {
            strengthside: {
              condWeek: payload,
            },
            otherHybridKey: { keep: true },
          },
        },
      }),
    );
    const result = await pullCondBankRemote('dan veldman', 'W1');
    expect(result.status).toBe('loaded');
    expect(result.conditioning).toEqual(clampCondWeek(sample));
  });

  it('pushes into app_state and athlete_feed digest', async () => {
    const upserts: Array<{ table: string; row: Record<string, unknown> }> = [];
    const sb = makeSb({
      appState: { state: { hybridOnly: 1 } },
      feed: { payload: { existing: true } },
    });
    const originalFrom = sb.from.bind(sb);
    // Test double: capture upsert payloads without fighting mock return types.
    (sb as { from: (table: string) => unknown }).from = (table: string) => {
      const base = originalFrom(table);
      return {
        select: base.select,
        upsert: async (row: Record<string, unknown>) => {
          upserts.push({ table, row });
          return { error: null };
        },
      };
    };
    getSupabase.mockReturnValue(sb);

    const result: RemoteSyncResult = await pushCondBankRemote(payload);
    expect(result.status).toBe('saved');
    expect(upserts.map(u => u.table)).toEqual(['app_state', 'athlete_feed']);
    const appRow = upserts[0].row as { state: Record<string, unknown> };
    expect(appRow.state.hybridOnly).toBe(1);
    expect((appRow.state.strengthside as { condWeek: StoredCondBank }).condWeek.weekId).toBe('W1');
    const feedRow = upserts[1].row as { payload: Record<string, unknown> };
    expect(feedRow.payload.existing).toBe(true);
    expect(feedRow.payload[FEED_COND_WEEK_KEY]).toMatchObject({ weekId: 'W1' });
  });
});
