export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const [
    { data: projects, error: e1 },
    { data: expenses, error: e2 },
    { data: revenues, error: e3 },
    { data: alerts, error: e4 },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('company_id', COMPANY_ID),
    supabase.from('expenses').select('*').eq('company_id', COMPANY_ID),
    supabase.from('revenues').select('*').eq('company_id', COMPANY_ID),
    supabase.from('audit_alerts').select('id').eq('company_id', COMPANY_ID).eq('status', 'pending'),
  ])

  const dbError = e1 || e2 || e3 || e4
  if (dbError) {
    console.error('[DB Error] GET dashboard/overview:', dbError.message)
    return NextResponse.json({ error: 'Erro ao carregar dados do dashboard.' }, { status: 500 })
  }

  const totalExpenses = (expenses || [])
    .filter(e => e.payment_status !== 'cancelled')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalRevenue = (revenues || [])
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const totalReceived = (revenues || [])
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const totalPaid = (expenses || [])
    .filter(e => e.payment_status === 'paid')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const payables = (expenses || [])
    .filter(e => e.payment_status === 'pending' || e.payment_status === 'overdue')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const receivables = (revenues || [])
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
  const cashBalance = totalReceived - totalPaid
  const activeProjects = (projects || []).filter(p => p.status === 'execution').length

  const projectsSummary = (projects || []).map(p => {
    const projExpenses = (expenses || []).filter(e => e.project_id === p.id && e.payment_status !== 'cancelled')
    const projRevenues = (revenues || []).filter(r => r.project_id === p.id && r.status !== 'cancelled')
    const totalSpent = projExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const totalRec = projRevenues.reduce((s, r) => s + Number(r.amount), 0)
    return {
      ...p,
      totalSpent,
      totalReceived: totalRec,
      profit: totalRec - totalSpent,
    }
  })

  return NextResponse.json({
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin,
    cashBalance,
    payables,
    receivables,
    activeProjects,
    pendingAlerts: (alerts || []).length,
    projects: projectsSummary,
  })
}
