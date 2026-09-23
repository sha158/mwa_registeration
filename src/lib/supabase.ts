import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/services/supabase/database.types'

let client: SupabaseClient<Database> | null = null

/**
 * The single browser Supabase client. Uses the publishable key only — every privilege
 * decision is made by Row Level Security and database functions.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example).',
    )
  }
  client = createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  })
  return client
}
