export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createDailyReportSchema, updateDailyReportSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  let query = supabase
    .from('daily_reports')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET daily-reports')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createDailyReportSchema)
  if (!validation.success) return validation.response

  const userId = req.headers.get('x-user-id')

  const { data, error } = await supabase
    .from('daily_reports')
    .insert({ ...validation.data, company_id: COMPANY_ID, created_by: userId })
    .select()
    .single()

  if (error) return handleDbError(error, 'POST daily-reports')
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

  const validation = validateBody(updateData, updateDailyReportSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('daily_reports')
    .update(validation.data)
    .eq('id', id)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PUT daily-reports')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

  const { error } = await supabase.from('daily_reports').delete().eq('id', id).eq('company_id', COMPANY_ID)
  if (error) return handleDbError(error, 'DELETE daily-report')
  return NextResponse.json({ success: true })
}
