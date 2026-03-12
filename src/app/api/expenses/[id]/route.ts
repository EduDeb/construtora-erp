export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateExpenseSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*, project:projects(id,name), category:cost_categories(id,name), supplier:suppliers(id,name)')
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .single()

  if (error) return handleDbError(error, 'GET expense')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateExpenseSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('expenses')
    .update(validation.data)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PUT expense')
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateExpenseSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('expenses')
    .update(validation.data)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PATCH expense')
  return NextResponse.json(data)
}
