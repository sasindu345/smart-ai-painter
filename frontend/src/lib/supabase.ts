import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    // Return a dummy client that won't crash during build/SSG
    // Auth features simply won't work until env vars are configured
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error("Supabase not configured"),
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: new Error("Supabase not configured"),
        }),
        signInWithOAuth: async () => ({
          data: { provider: "", url: "" },
          error: new Error("Supabase not configured"),
        }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as SupabaseClient;
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
