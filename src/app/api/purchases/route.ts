import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const supplierId = searchParams.get('supplier_id')

  let query = supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name), project:projects(id,name), items:purchase_items(*)')
    .eq('company_id', COMPANY_ID)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (supplierId) query = query.eq('supplier_id', supplierId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { items, ...orderData } = await req.json()

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({ ...orderData, company_id: COMPANY_ID })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  if (items?.length) {
    const itemsWithOrder = items.map((i: any) => ({ ...i, purchase_order_id: order.id }))
    await supabase.from('purchase_items').insert(itemsWithOrder)
  }

  return NextResponse.json(order, { status: 201 })
}
