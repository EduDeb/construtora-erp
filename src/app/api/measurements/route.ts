export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createMeasurementSchema, updateMeasurementSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')

  let query = supabase
    .from('measurements')
    .select('*, budget_item:project_budget_items(id,phase,description)')
    .eq('company_id', COMPANY_ID)
    .order('measurement_date', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET measurements')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createMeasurementSchema)
  if (!validation.success) return validation.response

  const userId = req.headers.get('x-user-id')

  const { data, error } = await supabase
    .from('measurements')
    .insert({ ...validation.data, company_id: COMPANY_ID, measured_by: userId })
    .select('*, budget_item:project_budget_items(id,phase,description)')
    .single()

  if (error) return handleDbError(error, 'POST measurements')
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

  const validation = validateBody(updateData, updateMeasurementSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase
    .from('measurements')
    .update(validation.data)
    .eq('id', id)
    .eq('company_id', COMPANY_ID)
    .select('*, budget_item:project_budget_items(id,phase,description)')
    .single()

  if (error) return handleDbError(error, 'PUT measurements')
  return NextResponse.json(data)
}
