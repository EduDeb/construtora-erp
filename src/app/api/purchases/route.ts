export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createPurchaseSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const supplierId = searchParams.get('supplier_id')

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name), project:projects(id,name), items:purchase_items(*)')
    .eq('company_id', COMPANY_ID)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (projectId) query = query.eq('project_id', projectId)
  if (supplierId) query = query.eq('supplier_id', supplierId)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET purchases')

  // Count query with same filters
  let countQuery = supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID)
  if (projectId) countQuery = countQuery.eq('project_id', projectId)
  if (supplierId) countQuery = countQuery.eq('supplier_id', supplierId)
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

  const validation = validateBody(body, createPurchaseSchema)
  if (!validation.success) return validation.response

  const { items, ...orderData } = validation.data

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({ ...orderData, company_id: COMPANY_ID })
    .select()
    .single()

  if (orderError) return handleDbError(orderError, 'POST purchase order')

  if (items?.length) {
    const itemsWithOrder = items.map((i) => ({ ...i, purchase_order_id: order.id }))
    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsWithOrder)
    if (itemsError) {
      // Rollback: delete the orphan order
      await supabase.from('purchase_orders').delete().eq('id', order.id)
      return handleDbError(itemsError, 'POST purchase items')
    }
  }

  return NextResponse.json(order, { status: 201 })
}
