import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Soft Supabase client for the shared project (same as hybrid / apps/web).
 * Returns null when env is unset so a fresh clone still runs offline.
 *
 * Expo inlines EXPO_PUBLIC_* at bundle time.
 */
let client: SupabaseClient | null = null;

function readEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string | undefined {
  // Metro/Expo replaces process.env.EXPO_PUBLIC_* at build time.
  if (name === 'EXPO_PUBLIC_SUPABASE_URL') return process.env.EXPO_PUBLIC_SUPABASE_URL;
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = readEnv('EXPO_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(readEnv('EXPO_PUBLIC_SUPABASE_URL') && readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}

/** Test-only: drop the cached client between cases. */
export function __resetSupabaseClientForTests(): void {
  client = null;
}
