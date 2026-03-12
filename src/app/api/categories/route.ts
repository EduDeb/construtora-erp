export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { createCategorySchema } from '@/lib/validations'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('cost_categories').select('*').eq('company_id', COMPANY_ID).order('name')
  if (error) return handleDbError(error, 'GET categories')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, createCategorySchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('cost_categories').insert({ ...validation.data, company_id: COMPANY_ID }).select().single()
  if (error) return handleDbError(error, 'POST categories')
  return NextResponse.json(data, { status: 201 })
}
