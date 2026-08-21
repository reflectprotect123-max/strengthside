import type { CondWeek, StoredCondBank } from './condBankStorage';
import { clampCondWeek, isStoredCondBank } from './condBankStorage';
import { getSupabase } from './supabase';

/** Namespace inside hybrid-owned `app_state.state` jsonb — never overwrite sibling keys. */
export const APP_STATE_STRENGTH_KEY = 'strengthside';
export const APP_STATE_COND_WEEK_KEY = 'condWeek';

/** Coach-visible digest key inside hybrid-owned `athlete_feed.payload`. */
export const FEED_COND_WEEK_KEY = 'condWeekBank';

export type RemoteSyncStatus = 'skipped' | 'saved' | 'loaded' | 'error';

export interface RemoteSyncResult {
  status: RemoteSyncStatus;
  reason?: string;
  conditioning?: CondWeek;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function readNestedCondWeek(state: Record<string, unknown>): StoredCondBank | null {
  const strength = asRecord(state[APP_STATE_STRENGTH_KEY]);
  const raw = strength[APP_STATE_COND_WEEK_KEY];
  return isStoredCondBank(raw) ? raw : null;
}

/**
 * Pull week bank from hybrid `app_state` when the user is signed in.
 * Soft-fails (skipped/error) without wiping local data.
 */
export async function pullCondBankRemote(
  athlete: string,
  weekId: string,
): Promise<RemoteSyncResult> {
  const sb = getSupabase();
  if (!sb) return { status: 'skipped', reason: 'supabase-not-configured' };

  try {
    const { data: auth } = await sb.auth.getSession();
    const uid = auth.session?.user?.id;
    if (!uid) return { status: 'skipped', reason: 'not-signed-in' };

    const { data, error } = await sb.from('app_state').select('state').eq('user_id', uid).maybeSingle();
    if (error) return { status: 'error', reason: error.message };
    if (!data) return { status: 'skipped', reason: 'no-remote-row' };

    const stored = readNestedCondWeek(asRecord(data.state));
    if (!stored) return { status: 'skipped', reason: 'no-remote-bank' };
    if (stored.athlete !== athlete || stored.weekId !== weekId) {
      return { status: 'skipped', reason: 'athlete-or-week-mismatch' };
    }
    return { status: 'loaded', conditioning: clampCondWeek(stored.conditioning) };
  } catch (e) {
    return { status: 'error', reason: e instanceof Error ? e.message : 'pull-failed' };
  }
}

/**
 * Merge week bank into hybrid `app_state` and publish a digest on `athlete_feed`
 * so a linked coach can read it — without a strength-side migration.
 */
export async function pushCondBankRemote(payload: StoredCondBank): Promise<RemoteSyncResult> {
  const sb = getSupabase();
  if (!sb) return { status: 'skipped', reason: 'supabase-not-configured' };

  try {
    const { data: auth } = await sb.auth.getSession();
    const uid = auth.session?.user?.id;
    if (!uid) return { status: 'skipped', reason: 'not-signed-in' };

    const clamped: StoredCondBank = {
      ...payload,
      conditioning: clampCondWeek(payload.conditioning),
    };

    const { data: existing, error: readErr } = await sb
      .from('app_state')
      .select('state')
      .eq('user_id', uid)
      .maybeSingle();
    if (readErr) return { status: 'error', reason: readErr.message };

    const prevState = asRecord(existing?.state);
    const prevStrength = asRecord(prevState[APP_STATE_STRENGTH_KEY]);
    const nextState = {
      ...prevState,
      [APP_STATE_STRENGTH_KEY]: {
        ...prevStrength,
        [APP_STATE_COND_WEEK_KEY]: {
          ...clamped,
          updatedAt: new Date().toISOString(),
        },
      },
    };

    const { error: upsertErr } = await sb.from('app_state').upsert(
      { user_id: uid, state: nextState },
      { onConflict: 'user_id' },
    );
    if (upsertErr) return { status: 'error', reason: upsertErr.message };

    // Coach-readable digest — merge only our key.
    const { data: feedRow } = await sb
      .from('athlete_feed')
      .select('payload')
      .eq('athlete_id', uid)
      .maybeSingle();
    const prevFeed = asRecord(feedRow?.payload);
    const feedPayload = {
      ...prevFeed,
      [FEED_COND_WEEK_KEY]: {
        athlete: clamped.athlete,
        weekId: clamped.weekId,
        conditioning: clamped.conditioning,
        updatedAt: new Date().toISOString(),
      },
    };
    const { error: feedErr } = await sb.from('athlete_feed').upsert(
      { athlete_id: uid, payload: feedPayload },
      { onConflict: 'athlete_id' },
    );
    if (feedErr) return { status: 'error', reason: feedErr.message };

    return { status: 'saved', conditioning: clamped.conditioning };
  } catch (e) {
    return { status: 'error', reason: e instanceof Error ? e.message : 'push-failed' };
  }
}
