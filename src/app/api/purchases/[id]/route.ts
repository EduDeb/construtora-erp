import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(*), project:projects(id,name), items:purchase_items(*)')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { items, ...orderData } = await req.json()

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(orderData)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    await supabase.from('purchase_items').delete().eq('purchase_order_id', params.id)
    if (items.length) {
      const itemsWithOrder = items.map((i: any) => ({ ...i, purchase_order_id: params.id }))
      await supabase.from('purchase_items').insert(itemsWithOrder)
    }
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(body)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
