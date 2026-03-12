export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServerClient()
  const alerts: { alert_type: string; severity: string; title: string; description: string; related_table?: string; related_id?: string }[] = []

  const [
    { data: expenses, error: e1 },
    { data: revenues, error: e2 },
    { data: payroll, error: e3 },
    { data: projects, error: e4 },
  ] = await Promise.all([
    supabase.from('expenses').select('*').eq('company_id', COMPANY_ID).neq('payment_status', 'cancelled'),
    supabase.from('revenues').select('*').eq('company_id', COMPANY_ID).neq('status', 'cancelled'),
    supabase.from('payroll').select('*, employee:employees(name)').eq('company_id', COMPANY_ID),
    supabase.from('projects').select('*').eq('company_id', COMPANY_ID),
  ])

  const dbError = e1 || e2 || e3 || e4
  if (dbError) {
    console.error('[DB Error] POST audit/check:', dbError.message)
    return NextResponse.json({ error: 'Erro ao carregar dados para verificação.' }, { status: 500 })
  }

  // 1. DUPLICATE EXPENSES
  const expList = expenses || []
  for (let i = 0; i < expList.length; i++) {
    for (let j = i + 1; j < expList.length; j++) {
      const a = expList[i], b = expList[j]
      if (a.supplier_id && a.supplier_id === b.supplier_id && Number(a.amount) === Number(b.amount)) {
        const daysDiff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000
        if (daysDiff <= 3) {
          alerts.push({
            alert_type: 'DUPLICATE_EXPENSE',
            severity: 'critical',
            title: 'Possível despesa duplicada',
            description: `Duas despesas com mesmo fornecedor e valor R$ ${Number(a.amount).toLocaleString('pt-BR')} em datas próximas (${a.date} e ${b.date})`,
            related_table: 'expenses',
            related_id: b.id,
          })
        }
      }
    }
  }

  // 2. DUPLICATE RECEIPT
  const receiptMap: Record<string, string[]> = {}
  for (const e of expList) {
    if (e.receipt_url) {
      if (!receiptMap[e.receipt_url]) receiptMap[e.receipt_url] = []
      receiptMap[e.receipt_url].push(e.id)
    }
  }
  for (const [, ids] of Object.entries(receiptMap)) {
    if (ids.length > 1) {
      alerts.push({
        alert_type: 'DUPLICATE_RECEIPT',
        severity: 'critical',
        title: 'Recibo/NF duplicado',
        description: `O mesmo comprovante foi usado em ${ids.length} despesas diferentes`,
        related_table: 'expenses',
        related_id: ids[1],
      })
    }
  }

  // 3. DOUBLE PAYROLL
  const payrollMap: Record<string, any[]> = {}
  for (const p of (payroll || [])) {
    const key = `${p.employee_id}-${p.reference_month}`
    if (!payrollMap[key]) payrollMap[key] = []
    payrollMap[key].push(p)
  }
  for (const [, entries] of Object.entries(payrollMap)) {
    if (entries.length > 1) {
      alerts.push({
        alert_type: 'DOUBLE_PAYROLL',
        severity: 'critical',
        title: 'Pagamento duplicado de funcionário',
        description: `${entries[0].employee?.name || 'Funcionário'} tem ${entries.length} lançamentos na folha de ${entries[0].reference_month}`,
        related_table: 'payroll',
        related_id: entries[1].id,
      })
    }
  }

  // 4. AMOUNT ANOMALY
  for (const e of expList) {
    if (!e.project_id) continue
    const proj = (projects || []).find(p => p.id === e.project_id)
    if (proj && Number(proj.estimated_budget) > 0) {
      const pct = (Number(e.amount) / Number(proj.estimated_budget)) * 100
      if (pct > 30) {
        alerts.push({
          alert_type: 'AMOUNT_ANOMALY',
          severity: 'critical',
          title: 'Despesa com valor anômalo',
          description: `Despesa de R$ ${Number(e.amount).toLocaleString('pt-BR')} representa ${pct.toFixed(1)}% do orçamento da obra "${proj.name}"`,
          related_table: 'expenses',
          related_id: e.id,
        })
      }
    }
  }

  // 5. DATE ERRORS
  const today = new Date()
  const futureLimit = new Date(today.getTime() + 60 * 86400000)
  for (const e of expList) {
    if (e.paid_date && e.date && new Date(e.paid_date) < new Date(e.date)) {
      alerts.push({
        alert_type: 'DATE_ERROR',
        severity: 'warning',
        title: 'Data de pagamento anterior à despesa',
        description: `Despesa "${e.description}" tem data de pagamento (${e.paid_date}) antes da data da despesa (${e.date})`,
        related_table: 'expenses',
        related_id: e.id,
      })
    }
    if (e.due_date && new Date(e.due_date) > futureLimit) {
      alerts.push({
        alert_type: 'DATE_ERROR',
        severity: 'info',
        title: 'Data de vencimento muito distante',
        description: `Despesa "${e.description}" tem vencimento em ${e.due_date} (mais de 60 dias no futuro)`,
        related_table: 'expenses',
        related_id: e.id,
      })
    }
  }

  // 6. BUDGET OVERRUN
  for (const proj of (projects || [])) {
    if (Number(proj.estimated_budget) <= 0) continue
    const projExpenses = expList.filter(e => e.project_id === proj.id)
    const totalSpent = projExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const budgetPct = (totalSpent / Number(proj.estimated_budget)) * 100
    if (budgetPct > 90 && proj.completion_percentage < 70) {
      alerts.push({
        alert_type: 'BUDGET_OVERRUN',
        severity: 'critical',
        title: 'Obra com risco de estouro de orçamento',
        description: `"${proj.name}" gastou ${budgetPct.toFixed(0)}% do orçamento mas está apenas ${proj.completion_percentage}% concluída`,
        related_table: 'projects',
        related_id: proj.id,
      })
    }
  }

  // 7. MISSING LINK
  for (const e of expList) {
    if (!e.project_id || !e.category_id) {
      alerts.push({
        alert_type: 'MISSING_LINK',
        severity: 'info',
        title: 'Despesa sem vínculo completo',
        description: `Despesa "${e.description}" (R$ ${Number(e.amount).toLocaleString('pt-BR')}) está sem ${!e.project_id ? 'obra' : 'categoria'} vinculada`,
        related_table: 'expenses',
        related_id: e.id,
      })
    }
  }

  // 8. SUPPLIER CONCENTRATION
  for (const proj of (projects || [])) {
    const projExp = expList.filter(e => e.project_id === proj.id && e.supplier_id)
    const totalProj = projExp.reduce((s, e) => s + Number(e.amount), 0)
    if (totalProj <= 0) continue
    const bySupplier: Record<string, number> = {}
    for (const e of projExp) {
      bySupplier[e.supplier_id!] = (bySupplier[e.supplier_id!] || 0) + Number(e.amount)
    }
    for (const [sid, total] of Object.entries(bySupplier)) {
      const pct = (total / totalProj) * 100
      if (pct > 40) {
        alerts.push({
          alert_type: 'SUPPLIER_CONCENTRATION',
          severity: 'warning',
          title: 'Concentração em fornecedor',
          description: `Um fornecedor concentra ${pct.toFixed(0)}% dos custos da obra "${proj.name}" (R$ ${total.toLocaleString('pt-BR')})`,
          related_table: 'suppliers',
          related_id: sid,
        })
      }
    }
  }

  // Insert new alerts (avoid duplicates)
  const { data: existingAlerts } = await supabase
    .from('audit_alerts')
    .select('alert_type, related_id')
    .eq('company_id', COMPANY_ID)
    .eq('status', 'pending')

  const existingKeys = new Set((existingAlerts || []).map(a => `${a.alert_type}-${a.related_id}`))

  const newAlerts = alerts
    .filter(a => !existingKeys.has(`${a.alert_type}-${a.related_id}`))
    .map(a => ({ ...a, company_id: COMPANY_ID }))

  if (newAlerts.length > 0) {
    await supabase.from('audit_alerts').insert(newAlerts)
  }

  return NextResponse.json({
    checked: true,
    totalChecks: alerts.length,
    newAlerts: newAlerts.length,
    existingSkipped: alerts.length - newAlerts.length,
  })
}
