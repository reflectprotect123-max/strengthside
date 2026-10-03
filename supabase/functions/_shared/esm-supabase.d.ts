// Ambient types for the Deno Edge import in auth.ts.
// tsc has no resolver for https://esm.sh specifiers (same pattern as
// embed-coaching-note/jsr-supabase.d.ts for jsr:).
declare module 'https://esm.sh/@supabase/supabase-js@2.49.1' {
  export interface AuthUser {
    id: string;
  }
  export interface SupabaseClientLike {
    auth: {
      getUser(jwt: string): Promise<{ data: { user: AuthUser | null }; error: unknown }>;
    };
  }
  export function createClient(
    url: string,
    key: string,
    options?: { auth?: { persistSession?: boolean; autoRefreshToken?: boolean } },
  ): SupabaseClientLike;
}
