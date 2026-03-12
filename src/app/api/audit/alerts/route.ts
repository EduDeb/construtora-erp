export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { patchAlertSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const countOnly = searchParams.get('count_only')

  let query = supabase.from('audit_alerts').select(countOnly ? 'id' : '*').eq('company_id', COMPANY_ID).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query
  if (error) return handleDbError(error, 'GET audit alerts')

  if (countOnly) return NextResponse.json({ count: (data || []).length })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, patchAlertSchema)
  if (!validation.success) return validation.response

  const { id, status: newStatus } = validation.data

  const updateData: Record<string, string> = { status: newStatus }
  if (newStatus === 'reviewed') updateData.reviewed_at = new Date().toISOString()
  if (newStatus === 'resolved') updateData.resolved_at = new Date().toISOString()

  const { data, error } = await supabase.from('audit_alerts').update(updateData).eq('id', id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PATCH audit alert')
  return NextResponse.json(data)
}
