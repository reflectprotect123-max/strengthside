import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local-only conditioning week bank. Not Supabase — phone remembers Finish · bank. */
export const COND_BANK_STORAGE_KEY = 'hybrid.strength.condWeek.v1';

export interface ZoneBank {
  banked: number;
  target: number;
}

export interface CondWeek {
  low: ZoneBank;
  mod: ZoneBank;
  high: ZoneBank;
}

export interface StoredCondBank {
  athlete: string;
  weekId: string;
  conditioning: CondWeek;
}

function isZoneBank(v: unknown): v is ZoneBank {
  if (!v || typeof v !== 'object') return false;
  const z = v as ZoneBank;
  return typeof z.banked === 'number' && typeof z.target === 'number' && z.target > 0;
}

function isCondWeek(v: unknown): v is CondWeek {
  if (!v || typeof v !== 'object') return false;
  const c = v as CondWeek;
  return isZoneBank(c.low) && isZoneBank(c.mod) && isZoneBank(c.high);
}

export function isStoredCondBank(v: unknown): v is StoredCondBank {
  if (!v || typeof v !== 'object') return false;
  const s = v as StoredCondBank;
  return (
    typeof s.athlete === 'string' &&
    typeof s.weekId === 'string' &&
    isCondWeek(s.conditioning)
  );
}

export function clampCondWeek(week: CondWeek): CondWeek {
  const clampZone = (z: ZoneBank): ZoneBank => ({
    target: z.target,
    banked: Math.min(z.target, Math.max(0, Math.round(z.banked))),
  });
  return {
    low: clampZone(week.low),
    mod: clampZone(week.mod),
    high: clampZone(week.high),
  };
}

export async function loadCondBank(
  athlete: string,
  weekId: string,
): Promise<CondWeek | null> {
  try {
    const raw = await AsyncStorage.getItem(COND_BANK_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredCondBank(parsed)) return null;
    if (parsed.athlete !== athlete || parsed.weekId !== weekId) return null;
    return clampCondWeek(parsed.conditioning);
  } catch {
    return null;
  }
}

export async function saveCondBank(
  athlete: string,
  weekId: string,
  conditioning: CondWeek,
): Promise<void> {
  const payload: StoredCondBank = {
    athlete,
    weekId,
    conditioning: clampCondWeek(conditioning),
  };
  await AsyncStorage.setItem(COND_BANK_STORAGE_KEY, JSON.stringify(payload));
}

export async function clearCondBank(): Promise<void> {
  await AsyncStorage.removeItem(COND_BANK_STORAGE_KEY);
}
