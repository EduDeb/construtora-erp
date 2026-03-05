export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('date', { ascending: true })

  // Group by month
  const byMonth: Record<string, { income: number; expense: number }> = {}

  for (const t of (transactions || [])) {
    const month = t.date.substring(0, 7) // YYYY-MM
    if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 }
    if (t.type === 'income') byMonth[month].income += Number(t.amount)
    else byMonth[month].expense += Number(t.amount)
  }

  let runningBalance = 0
  const data = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => {
      runningBalance += values.income - values.expense
      const [y, m] = month.split('-')
      const label = `${m}/${y}`
      return {
        month: label,
        receitas: values.income,
        despesas: values.expense,
        saldo: runningBalance,
      }
    })

  return NextResponse.json(data)
}
