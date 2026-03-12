export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { handleDbError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const recordId = searchParams.get('record_id')

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (table) query = query.eq('table_name', table)
  if (recordId) query = query.eq('record_id', recordId)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET audit log')

  // Count query with same filters
  let countQuery = supabase.from('audit_log').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID)
  if (table) countQuery = countQuery.eq('table_name', table)
  if (recordId) countQuery = countQuery.eq('record_id', recordId)
  const { count } = await countQuery

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(count || 0),
      'X-Page': String(page),
      'X-Per-Page': String(perPage),
    }
  })
}
