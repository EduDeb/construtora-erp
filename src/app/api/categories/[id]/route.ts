export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateCategorySchema } from '@/lib/validations'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateCategorySchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('cost_categories').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PUT category')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()

  // Check referential integrity
  const { count } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('category_id', params.id)
  if (count && count > 0) {
    return NextResponse.json({ error: `Não é possível excluir: ${count} despesa(s) vinculada(s) a esta categoria.` }, { status: 409 })
  }

  const { error } = await supabase.from('cost_categories').delete().eq('id', params.id).eq('company_id', COMPANY_ID)
  if (error) return handleDbError(error, 'DELETE category')
  return NextResponse.json({ success: true })
}
