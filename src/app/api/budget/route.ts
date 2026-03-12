export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createBudgetItemSchema, updateBudgetItemSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')

  let query = supabase
    .from('project_budget_items')
    .select('*, category:cost_categories(id,name)')
    .eq('company_id', COMPANY_ID)
    .order('sort_order')
    .order('phase')

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET budget')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createBudgetItemSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('project_budget_items')
    .insert({ ...validation.data, company_id: COMPANY_ID })
    .select('*, category:cost_categories(id,name)')
    .single()

  if (error) return handleDbError(error, 'POST budget')
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

  const validation = validateBody(updateData, updateBudgetItemSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('project_budget_items')
    .update(validation.data)
    .eq('id', id)
    .eq('company_id', COMPANY_ID)
    .select('*, category:cost_categories(id,name)')
    .single()

  if (error) return handleDbError(error, 'PUT budget')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('project_budget_items')
    .delete()
    .eq('id', id)
    .eq('company_id', COMPANY_ID)

  if (error) return handleDbError(error, 'DELETE budget')
  return NextResponse.json({ success: true })
}
