import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, any> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    company_id: COMPANY_ID,
  }

  try {
    const supabase = createServerClient()
    
    // Test connection
    const { data: companies, error: compError } = await supabase.from('companies').select('id, name').limit(1)
    checks.db_connection = !compError
    checks.db_error = compError?.message || null
    checks.companies = companies

    // Test each table
    const tables = ['projects', 'expenses', 'revenues', 'suppliers', 'employees', 'cost_categories', 'audit_alerts', 'audit_log']
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      checks[`table_${table}`] = !error ? 'OK' : error.message
    }
  } catch (err: any) {
    checks.connection_error = err.message
  }

  return NextResponse.json(checks, { status: 200 })
}
