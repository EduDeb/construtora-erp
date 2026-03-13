export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateRevenueSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('revenues').select('*, project:projects(id,name)').eq('id', params.id).eq('company_id', COMPANY_ID).single()
  if (error) return handleDbError(error, 'GET revenue')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateRevenueSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('revenues').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PUT revenue')
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateRevenueSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('revenues').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PATCH revenue')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const { error } = await supabase.from('revenues').delete().eq('id', params.id).eq('company_id', COMPANY_ID)
  if (error) return handleDbError(error, 'DELETE revenue')
  return NextResponse.json({ success: true })
}
