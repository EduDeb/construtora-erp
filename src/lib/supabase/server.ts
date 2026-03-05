import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  
  return createSupabaseClient(url, key)
}

// Default company ID for single-tenant use
export const COMPANY_ID = '00000000-0000-0000-0000-000000000001'
