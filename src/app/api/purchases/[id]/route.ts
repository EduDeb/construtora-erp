export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updatePurchaseSchema, patchPurchaseSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(*), project:projects(id,name), items:purchase_items(*)')
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .single()
  if (error) return handleDbError(error, 'GET purchase')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updatePurchaseSchema)
  if (!validation.success) return validation.response

  const { items, ...orderData } = validation.data

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(orderData)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PUT purchase')

  if (items) {
    // Backup old items before deleting
    const { data: oldItems } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_order_id', params.id)

    await supabase.from('purchase_items').delete().eq('purchase_order_id', params.id)

    if (items.length) {
      const itemsWithOrder = items.map((i) => ({ ...i, purchase_order_id: params.id }))
      const { error: itemsError } = await supabase.from('purchase_items').insert(itemsWithOrder)
      if (itemsError) {
        // Rollback: restore old items
        if (oldItems?.length) {
          await supabase.from('purchase_items').insert(oldItems)
        }
        return handleDbError(itemsError, 'PUT purchase items')
      }
    }
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, patchPurchaseSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(validation.data)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()
  if (error) return handleDbError(error, 'PATCH purchase')
  return NextResponse.json(data)
}
