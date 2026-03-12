export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError } from '@/lib/api-helpers'
import { patchPayrollSchema } from '@/lib/validations'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, patchPayrollSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('payroll').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PATCH payroll')
  return NextResponse.json(data)
}
