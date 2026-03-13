export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateSupplierSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', params.id).eq('company_id', COMPANY_ID).single()
  if (error) return handleDbError(error, 'GET supplier')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateSupplierSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('suppliers').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PUT supplier')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()

  const { count: purchaseCount } = await supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('supplier_id', params.id)
  const { count: expenseCount } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('supplier_id', params.id)
  const total = (purchaseCount || 0) + (expenseCount || 0)
  if (total > 0) {
    return NextResponse.json({ error: `Não é possível excluir: fornecedor possui ${total} registro(s) vinculado(s).` }, { status: 409 })
  }

  const { error } = await supabase.from('suppliers').delete().eq('id', params.id).eq('company_id', COMPANY_ID)
  if (error) return handleDbError(error, 'DELETE supplier')
  return NextResponse.json({ success: true })
}
