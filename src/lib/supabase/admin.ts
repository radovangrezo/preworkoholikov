import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ENV, requireEnv } from '@/lib/env'

let client: SupabaseClient | null = null

/**
 * Service-role Supabase client. Bypasses RLS, so this must never be imported
 * into anything that runs in the browser. Created lazily so a build without
 * secrets present does not fail.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv(ENV.supabaseUrl), requireEnv(ENV.supabaseServiceRoleKey), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
