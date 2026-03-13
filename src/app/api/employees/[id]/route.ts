export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { validateBody, handleDbError, checkWritePermission } from '@/lib/api-helpers'
import { updateEmployeeSchema } from '@/lib/validations'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('employees').select('*').eq('id', params.id).eq('company_id', COMPANY_ID).single()
  if (error) return handleDbError(error, 'GET employee')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()
  const body = await req.json()

  const validation = validateBody(body, updateEmployeeSchema)
  if (!validation.success) return validation.response

  const { data, error } = await supabase.from('employees').update(validation.data).eq('id', params.id).eq('company_id', COMPANY_ID).select().single()
  if (error) return handleDbError(error, 'PUT employee')
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await checkWritePermission(req)
  if (!perm.allowed) return perm.response

  const supabase = createServerClient()

  // Check payroll references
  const { count: payrollCount } = await supabase.from('payroll').select('id', { count: 'exact', head: true }).eq('employee_id', params.id)
  if (payrollCount && payrollCount > 0) {
    return NextResponse.json({ error: `Não é possível excluir: ${payrollCount} registro(s) de folha de pagamento vinculado(s).` }, { status: 409 })
  }

  // Check assignment references
  const { count: assignCount } = await supabase.from('employee_assignments').select('id', { count: 'exact', head: true }).eq('employee_id', params.id)
  if (assignCount && assignCount > 0) {
    return NextResponse.json({ error: `Não é possível excluir: ${assignCount} alocação(ões) em obra(s) vinculada(s).` }, { status: 409 })
  }

  const { error } = await supabase.from('employees').delete().eq('id', params.id).eq('company_id', COMPANY_ID)
  if (error) return handleDbError(error, 'DELETE employee')
  return NextResponse.json({ success: true })
}
