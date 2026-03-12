export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const pid = params.id

  const [
    { data: project, error: e1 },
    { data: expenses, error: e2 },
    { data: revenues, error: e3 },
    { data: schedule, error: e4 },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', pid).single(),
    supabase.from('expenses').select('*, category:cost_categories(name)').eq('project_id', pid),
    supabase.from('revenues').select('*').eq('project_id', pid),
    supabase.from('project_schedule').select('*').eq('project_id', pid).order('sort_order'),
  ])

  if (e1 || !project) {
    console.error('[DB Error] GET project summary:', e1?.message)
    return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
  }
  if (e2 || e3 || e4) {
    console.error('[DB Error] GET project summary data:', (e2 || e3 || e4)?.message)
  }

  const totalSpent = (expenses || []).filter(e => e.payment_status !== 'cancelled').reduce((s, e) => s + Number(e.amount), 0)
  const totalReceived = (revenues || []).filter(r => r.status === 'received').reduce((s, r) => s + Number(r.amount), 0)
  const totalRevenue = (revenues || []).filter(r => r.status !== 'cancelled').reduce((s, r) => s + Number(r.amount), 0)

  const costsByCategory: Record<string, number> = {}
  for (const e of (expenses || [])) {
    if (e.payment_status === 'cancelled') continue
    const cat = e.category?.name || 'Sem categoria'
    costsByCategory[cat] = (costsByCategory[cat] || 0) + Number(e.amount)
  }

  return NextResponse.json({
    project,
    totalSpent,
    totalReceived,
    totalRevenue,
    profit: totalRevenue - totalSpent,
    budgetUsed: project.estimated_budget > 0 ? (totalSpent / Number(project.estimated_budget)) * 100 : 0,
    costsByCategory: Object.entries(costsByCategory).map(([name, value]) => ({ name, value })),
    schedule: schedule || [],
  })
}
