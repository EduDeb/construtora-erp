export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { handleDbError, checkWritePermission } from '@/lib/api-helpers'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('companies').select('*').eq('id', COMPANY_ID).single()
  if (error) return handleDbError(error, 'GET company')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const allowedFields = ['name', 'cnpj', 'address', 'phone', 'email']
  const updateData: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  const { data, error } = await supabase.from('companies').update(updateData).eq('id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PUT company')
  return NextResponse.json(data)
}
