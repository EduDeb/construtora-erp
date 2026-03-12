export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createExpenseSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const supplierId = searchParams.get('supplier_id')
  const status = searchParams.get('status')

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('expenses')
    .select('*, project:projects(id,name), category:cost_categories(id,name), supplier:suppliers(id,name)')
    .eq('company_id', COMPANY_ID)
    .order('date', { ascending: false })
    .range(from, to)

  if (projectId) query = query.eq('project_id', projectId)
  if (supplierId) query = query.eq('supplier_id', supplierId)
  if (status) query = query.eq('payment_status', status)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET expenses')

  // Count query with same filters
  let countQuery = supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID)
  if (projectId) countQuery = countQuery.eq('project_id', projectId)
  if (supplierId) countQuery = countQuery.eq('supplier_id', supplierId)
  if (status) countQuery = countQuery.eq('payment_status', status)
  const { count } = await countQuery

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(count || 0),
      'X-Page': String(page),
      'X-Per-Page': String(perPage),
    }
  })
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createExpenseSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...validation.data, company_id: COMPANY_ID })
    .select()
    .single()

  if (error) return handleDbError(error, 'POST expenses')
  return NextResponse.json(data, { status: 201 })
}
