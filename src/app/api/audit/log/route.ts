export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const recordId = searchParams.get('record_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (table) query = query.eq('table_name', table)
  if (recordId) query = query.eq('record_id', recordId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
