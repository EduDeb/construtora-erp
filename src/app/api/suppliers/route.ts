export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createSupplierSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('name')
    .range(from, to)

  if (error) return handleDbError(error, 'GET suppliers')

  const { count } = await supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID)

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

  const validation = validateBody(body, createSupplierSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('suppliers').insert({ ...validation.data, company_id: COMPANY_ID }).select().single()
  if (error) return handleDbError(error, 'POST suppliers')
  return NextResponse.json(data, { status: 201 })
}
