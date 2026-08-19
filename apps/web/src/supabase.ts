import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The SHARED Supabase project — the same one THE-HYBRID-ENGINE1 talks to.
 * See CLAUDE.md's shared-Supabase contract: this repo owns twelve strength
 * tables and writes migrations against nothing else.
 *
 * Returns null rather than throwing when the env is unset, so a fresh clone
 * runs and shows a named "not configured" state instead of a white screen with
 * a console error. A missing config is a setup step, not a crash.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}

export function isConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
