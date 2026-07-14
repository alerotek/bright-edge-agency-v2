/**
 * Server-side Supabase client.
 * Uses the service role key for admin operations (bypasses RLS).
 * Only import this in server functions, never in client components.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createServerSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_SERVICE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    console.error(`[Supabase Server] Missing environment variable(s): ${missing.join(", ")}`);
    throw new Error(`Missing Supabase server environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _serverSupabase: ReturnType<typeof createServerSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createServerSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_serverSupabase) _serverSupabase = createServerSupabaseClient();
    return Reflect.get(_serverSupabase, prop, receiver);
  },
});