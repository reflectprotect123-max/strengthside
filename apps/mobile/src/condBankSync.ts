import { pullCondBankRemote, pushCondBankRemote, type RemoteSyncResult } from './condBankRemote';
import {
  loadCondBank,
  saveCondBank,
  type CondWeek,
  type StoredCondBank,
} from './condBankStorage';

/**
 * Local-first week bank with best-effort cloud sync into hybrid-owned
 * `app_state` / `athlete_feed` (no strength-side migration).
 */
export async function loadCondBankSynced(
  athlete: string,
  weekId: string,
): Promise<{ conditioning: CondWeek | null; remote: RemoteSyncResult }> {
  const local = await loadCondBank(athlete, weekId);
  const remote = await pullCondBankRemote(athlete, weekId);
  if (remote.status === 'loaded' && remote.conditioning) {
    await saveCondBank(athlete, weekId, remote.conditioning);
    return { conditioning: remote.conditioning, remote };
  }
  return { conditioning: local, remote };
}

export async function saveCondBankSynced(
  athlete: string,
  weekId: string,
  conditioning: CondWeek,
): Promise<RemoteSyncResult> {
  const payload: StoredCondBank = { athlete, weekId, conditioning };
  await saveCondBank(athlete, weekId, conditioning);
  return pushCondBankRemote(payload);
}
