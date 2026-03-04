import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  let query = supabase
    .from('payroll')
    .select('*, employee:employees(id,name,role_function), project:projects(id,name)')
    .eq('company_id', COMPANY_ID)
    .order('reference_month', { ascending: false })

  if (month) query = query.eq('reference_month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Generate payroll for a month
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { reference_month } = await req.json()

  // Get all active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*, assignments:employee_assignments(project_id)')
    .eq('company_id', COMPANY_ID)
    .eq('active', true)

  if (!employees?.length) return NextResponse.json({ error: 'Nenhum funcionário ativo' }, { status: 400 })

  const payrollEntries = employees.map(emp => ({
    company_id: COMPANY_ID,
    employee_id: emp.id,
    project_id: emp.assignments?.[0]?.project_id || null,
    reference_month,
    amount: Number(emp.base_salary),
    bonuses: 0,
    deductions: 0,
    net_amount: Number(emp.base_salary),
    status: 'pending',
  }))

  const { data, error } = await supabase.from('payroll').insert(payrollEntries).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
