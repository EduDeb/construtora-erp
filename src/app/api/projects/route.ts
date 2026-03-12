export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createProjectSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase.from('projects').select('*').eq('company_id', COMPANY_ID).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET projects')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createProjectSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...validation.data, company_id: COMPANY_ID })
    .select()
    .single()

  if (error) return handleDbError(error, 'POST projects')
  return NextResponse.json(data, { status: 201 })
}
