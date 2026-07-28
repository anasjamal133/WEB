import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Server-side Supabase client for secure operations.
 * 
 * IMPORTANT: This function should ONLY be used in server-side code.
 * NEVER expose the service role key in browser code.
 * 
 * @param accessToken - Optional access token for authenticated requests
 * @returns Supabase client instance
 */
export function createServerClient(accessToken?: string): SupabaseClient<Database> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined
    }
  })
}

/**
 * Create a server client with admin privileges.
 * WARNING: Use this ONLY for server-side operations that require elevated permissions.
 * NEVER use this in browser code or expose to users.
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createServerClient()
}
