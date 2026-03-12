export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateProjectSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .single()

  if (error) return handleDbError(error, 'GET project')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateProjectSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('projects')
    .update(validation.data)
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PUT project')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const { error } = await supabase
    .from('projects')
    .update({ status: 'suspended' })
    .eq('id', params.id)
    .eq('company_id', COMPANY_ID)

  if (error) return handleDbError(error, 'DELETE project')
  return NextResponse.json({ success: true })
}
