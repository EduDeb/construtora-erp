export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { handleDbError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const groupBy = searchParams.get('group_by') || 'category'

  // Get all paid/pending expenses for this project
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*, category:cost_categories(id,name), supplier:suppliers(id,name)')
    .eq('project_id', params.id)
    .eq('company_id', COMPANY_ID)
    .neq('payment_status', 'cancelled')

  if (error) return handleDbError(error, 'GET abc expenses')

  // Also get budget items for phase grouping
  const { data: budgetItems } = await supabase
    .from('project_budget_items')
    .select('*')
    .eq('project_id', params.id)
    .eq('company_id', COMPANY_ID)

  // Aggregate by selected grouping
  const aggregated: Record<string, number> = {}

  for (const expense of expenses || []) {
    let key: string
    if (groupBy === 'supplier') {
      key = expense.supplier?.name || 'Sem fornecedor'
    } else if (groupBy === 'budget_phase') {
      // Try to match expense category to budget phase
      const matchingBudget = (budgetItems || []).find(b => b.category_id === expense.category_id)
      key = matchingBudget?.phase || 'Sem fase'
    } else {
      key = expense.category?.name || 'Sem categoria'
    }
    aggregated[key] = (aggregated[key] || 0) + Number(expense.amount)
  }

  const totalCost = Object.values(aggregated).reduce((s, v) => s + v, 0)
  if (totalCost === 0) return NextResponse.json([])

  // Sort descending by value
  const sorted = Object.entries(aggregated)
    .map(([item, value]) => ({ item, value }))
    .sort((a, b) => b.value - a.value)

  // Calculate percentages and classify
  let cumulative = 0
  const result = sorted.map(entry => {
    const percentage = (entry.value / totalCost) * 100
    cumulative += percentage
    let classification: 'A' | 'B' | 'C'
    if (cumulative <= 80) classification = 'A'
    else if (cumulative <= 95) classification = 'B'
    else classification = 'C'

    return {
      item: entry.item,
      value: entry.value,
      percentage: Math.round(percentage * 100) / 100,
      cumulative_percentage: Math.round(cumulative * 100) / 100,
      classification,
    }
  })

  return NextResponse.json(result)
}
