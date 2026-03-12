"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { CostByCategoryChart } from "@/components/charts/cost-by-category-chart"
import { BudgetVsActualChart } from "@/components/charts/budget-vs-actual-chart"
import { Building2, ArrowLeft, Plus, Trash2, CloudSun, Sun, Cloud, CloudRain, CloudOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const weatherIcons: Record<string, any> = {
  sol: Sun,
  nublado: Cloud,
  chuva: CloudRain,
  chuva_forte: CloudRain,
  impraticavel: CloudOff,
}
const weatherLabels: Record<string, string> = {
  sol: 'Sol', nublado: 'Nublado', chuva: 'Chuva', chuva_forte: 'Chuva Forte', impraticavel: 'Impraticável',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [budget, setBudget] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<any[]>([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/projects/${id}/summary`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/expenses?project_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/revenues?project_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/budget?project_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/daily-reports?project_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/measurements?project_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([summary, exp, rev, bgt, rpt, msr]) => {
      setData(summary)
      if (Array.isArray(exp)) setExpenses(exp)
      if (Array.isArray(rev)) setRevenues(rev)
      if (Array.isArray(bgt)) setBudget(bgt)
      if (Array.isArray(rpt)) setReports(rpt)
      if (Array.isArray(msr)) setMeasurements(msr)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded" /></div>
  if (!data?.project) return <p>Obra não encontrada</p>

  const { project, totalSpent, totalReceived, totalRevenue, profit, budgetUsed, costsByCategory, schedule } = data

  const tabs = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'budget', label: 'Orçamento' },
    { key: 'costs', label: 'Custos' },
    { key: 'revenue', label: 'Receitas' },
    { key: 'rdo', label: 'Diário de Obra' },
    { key: 'measurements', label: 'Medições' },
    { key: 'schedule', label: 'Cronograma' },
  ]

  const budgetTotal = budget.reduce((s: number, b: any) => s + Number(b.total_price || 0), 0)

  const scheduleChart = (schedule || []).map((s: any) => ({
    phase: s.phase_name,
    planejado: Number(s.planned_cost),
    realizado: Number(s.actual_cost),
  }))

  // Previsto vs Realizado by phase
  const budgetByPhase: Record<string, number> = {}
  budget.forEach((b: any) => { budgetByPhase[b.phase] = (budgetByPhase[b.phase] || 0) + Number(b.total_price || 0) })
  const expenseByCategory: Record<string, number> = {}
  expenses.forEach((e: any) => {
    if (e.payment_status !== 'cancelled') {
      const cat = e.category?.name || 'Sem categoria'
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projetos" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.client_name || 'Sem cliente'} {project.address ? `• ${project.address}` : ''}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusColor(project.status)}`}>
          {statusLabel(project.status)}
        </span>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Progresso da Obra</span>
          <span className="font-medium">{project.completion_percentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${project.completion_percentage}%` }} />
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={{ project, totalSpent, totalReceived, totalRevenue, profit, budgetUsed, budgetTotal, costsByCategory, scheduleChart }} />}
      {tab === 'budget' && <BudgetTab projectId={id as string} budget={budget} onUpdate={loadData} />}
      {tab === 'costs' && <CostsTab expenses={expenses} />}
      {tab === 'revenue' && <RevenueTab revenues={revenues} />}
      {tab === 'rdo' && <RDOTab projectId={id as string} reports={reports} onUpdate={loadData} />}
      {tab === 'measurements' && <MeasurementsTab projectId={id as string} measurements={measurements} budget={budget} onUpdate={loadData} />}
      {tab === 'schedule' && <ScheduleTab schedule={schedule} scheduleChart={scheduleChart} />}
    </div>
  )
}

// ─── Overview Tab ──────────────────────────
function OverviewTab({ data }: { data: any }) {
  const { project, totalSpent, totalReceived, profit, budgetUsed, budgetTotal, costsByCategory, scheduleChart } = data
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Contrato</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(Number(project.contract_value))}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Orçamento</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(budgetTotal)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Gasto Total</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Recebido</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p className={`text-xl font-bold mt-1 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(profit)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Orçamento Utilizado</p>
          <p className="text-2xl font-bold">{budgetUsed.toFixed(1)}%</p>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className={`rounded-full h-2 ${budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Período</p>
          <p className="mt-1">{formatDate(project.start_date)} &rarr; {formatDate(project.expected_end_date)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostByCategoryChart data={costsByCategory} />
        {scheduleChart.length > 0 && <BudgetVsActualChart data={scheduleChart} />}
      </div>
    </div>
  )
}

// ─── Budget Tab ────────────────────────────
function BudgetTab({ projectId, budget, onUpdate }: { projectId: string; budget: any[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phase: '', description: '', unit: 'vb', quantity: '1', unit_price: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        phase: form.phase,
        description: form.description,
        unit: form.unit,
        quantity: parseFloat(form.quantity) || 1,
        unit_price: parseFloat(form.unit_price) || 0,
      }),
    })
    if (res.ok) {
      toast.success('Item adicionado ao orçamento!')
      setShowForm(false)
      setForm({ phase: '', description: '', unit: 'vb', quantity: '1', unit_price: '' })
      onUpdate()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao adicionar item')
    }
  }

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/budget?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Item removido'); onUpdate() }
  }

  const total = budget.reduce((s, b) => s + Number(b.total_price || 0), 0)

  // Group by phase
  const phases = Array.from(new Set(budget.map(b => b.phase)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Orçamento da Obra</h3>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(total)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Novo Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input required placeholder="Fase (ex: Fundação)" value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input required placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Unidade" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input type="number" step="0.01" placeholder="Quantidade" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input type="number" step="0.01" required placeholder="Valor Unitário" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      {phases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum item no orçamento</p>
        </div>
      ) : phases.map(phase => {
        const items = budget.filter(b => b.phase === phase)
        const phaseTotal = items.reduce((s, b) => s + Number(b.total_price || 0), 0)
        return (
          <div key={phase} className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-4 border-b bg-accent/30">
              <h4 className="font-semibold">{phase}</h4>
              <span className="font-medium">{formatCurrency(phaseTotal)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Qtd</th>
                    <th className="p-3">Un.</th>
                    <th className="p-3">Valor Un.</th>
                    <th className="p-3">Total</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-accent/50">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-sm">{Number(item.quantity)}</td>
                      <td className="p-3 text-sm">{item.unit}</td>
                      <td className="p-3 text-sm">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="p-3 font-medium">{formatCurrency(Number(item.total_price))}</td>
                      <td className="p-3">
                        <button onClick={() => deleteItem(item.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Costs Tab ─────────────────────────────
function CostsTab({ expenses }: { expenses: any[] }) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="p-4">Descrição</th><th className="p-4">Categoria</th><th className="p-4">Fornecedor</th><th className="p-4">Valor</th><th className="p-4">Data</th><th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma despesa registrada</td></tr>
          ) : expenses.map((e: any) => (
            <tr key={e.id} className="border-b hover:bg-accent/50">
              <td className="p-4 font-medium">{e.description}</td>
              <td className="p-4 text-sm">{e.category?.name || '-'}</td>
              <td className="p-4 text-sm">{e.supplier?.name || '-'}</td>
              <td className="p-4">{formatCurrency(Number(e.amount))}</td>
              <td className="p-4 text-sm">{formatDate(e.date)}</td>
              <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(e.payment_status)}`}>{statusLabel(e.payment_status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Revenue Tab ───────────────────────────
function RevenueTab({ revenues }: { revenues: any[] }) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="p-4">Descrição</th><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Data Prevista</th><th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {revenues.length === 0 ? (
            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma receita registrada</td></tr>
          ) : revenues.map((r: any) => (
            <tr key={r.id} className="border-b hover:bg-accent/50">
              <td className="p-4 font-medium">{r.description}</td>
              <td className="p-4 text-sm">{r.client_name || '-'}</td>
              <td className="p-4">{formatCurrency(Number(r.amount))}</td>
              <td className="p-4 text-sm">{formatDate(r.expected_date)}</td>
              <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(r.status)}`}>{statusLabel(r.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── RDO Tab ───────────────────────────────
function RDOTab({ projectId, reports, onUpdate }: { projectId: string; reports: any[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    weather: 'sol', workforce_own: '0', workforce_contractor: '0',
    activities: '', equipment_used: '', materials_received: '', incidents: '', notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/daily-reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        report_date: form.report_date,
        weather: form.weather,
        workforce_own: parseInt(form.workforce_own) || 0,
        workforce_contractor: parseInt(form.workforce_contractor) || 0,
        activities: form.activities || null,
        equipment_used: form.equipment_used || null,
        materials_received: form.materials_received || null,
        incidents: form.incidents || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      toast.success('Diário registrado!')
      setShowForm(false)
      onUpdate()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao registrar diário')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Diário de Obra (RDO)</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Novo Registro
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Data *</label>
              <input type="date" required value={form.report_date} onChange={e => setForm(p => ({ ...p, report_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Clima</label>
              <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="sol">Sol</option>
                <option value="nublado">Nublado</option>
                <option value="chuva">Chuva</option>
                <option value="chuva_forte">Chuva Forte</option>
                <option value="impraticavel">Impraticável</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Efetivo Próprio</label>
              <input type="number" value={form.workforce_own} onChange={e => setForm(p => ({ ...p, workforce_own: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Efetivo Terceirizado</label>
              <input type="number" value={form.workforce_contractor} onChange={e => setForm(p => ({ ...p, workforce_contractor: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Atividades Executadas</label>
            <textarea value={form.activities} onChange={e => setForm(p => ({ ...p, activities: e.target.value }))} rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="Descreva os serviços realizados..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Equipamentos Utilizados</label>
              <textarea value={form.equipment_used} onChange={e => setForm(p => ({ ...p, equipment_used: e.target.value }))} rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Materiais Recebidos</label>
              <textarea value={form.materials_received} onChange={e => setForm(p => ({ ...p, materials_received: e.target.value }))} rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Ocorrências / Incidentes</label>
            <textarea value={form.incidents} onChange={e => setForm(p => ({ ...p, incidents: e.target.value }))} rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="Registre qualquer ocorrência relevante..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Salvar Diário</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CloudSun size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum registro de diário de obra</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => {
            const WeatherIcon = weatherIcons[r.weather] || CloudSun
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{formatDate(r.report_date)}</span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent">
                      <WeatherIcon size={14} />
                      {weatherLabels[r.weather] || r.weather}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Efetivo: {r.workforce_own + r.workforce_contractor} ({r.workforce_own} + {r.workforce_contractor} terc.)
                  </span>
                </div>
                {r.activities && <div className="mb-2"><p className="text-sm font-medium text-muted-foreground">Atividades:</p><p className="text-sm">{r.activities}</p></div>}
                {r.incidents && <div className="mb-2 p-2 rounded bg-red-500/10"><p className="text-sm font-medium text-red-500">Ocorrências:</p><p className="text-sm">{r.incidents}</p></div>}
                {r.materials_received && <div><p className="text-sm font-medium text-muted-foreground">Materiais recebidos:</p><p className="text-sm">{r.materials_received}</p></div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Measurements Tab ──────────────────────
function MeasurementsTab({ projectId, measurements, budget, onUpdate }: { projectId: string; measurements: any[]; budget: any[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phase: '', measured_percentage: '', measured_value: '', measurement_date: new Date().toISOString().split('T')[0], notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/measurements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        phase: form.phase,
        measured_percentage: parseFloat(form.measured_percentage) || 0,
        measured_value: parseFloat(form.measured_value) || 0,
        measurement_date: form.measurement_date,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      toast.success('Medição registrada!')
      setShowForm(false)
      setForm({ phase: '', measured_percentage: '', measured_value: '', measurement_date: new Date().toISOString().split('T')[0], notes: '' })
      onUpdate()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao registrar medição')
    }
  }

  const phases = Array.from(new Set(budget.map(b => b.phase)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Medições / Avanço Físico</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Nova Medição
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {phases.length > 0 ? (
              <select required value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                className="px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar fase...</option>
                {phases.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input required placeholder="Fase" value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                className="px-3 py-2 rounded-lg border bg-background" />
            )}
            <input type="number" step="0.1" max="100" required placeholder="% Medido" value={form.measured_percentage}
              onChange={e => setForm(p => ({ ...p, measured_percentage: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input type="number" step="0.01" placeholder="Valor Medido (R$)" value={form.measured_value}
              onChange={e => setForm(p => ({ ...p, measured_value: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input type="date" required value={form.measurement_date}
              onChange={e => setForm(p => ({ ...p, measurement_date: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Data</th><th className="p-4">Fase</th><th className="p-4">% Medido</th><th className="p-4">Valor Medido</th><th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {measurements.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma medição registrada</td></tr>
            ) : measurements.map((m: any) => (
              <tr key={m.id} className="border-b hover:bg-accent/50">
                <td className="p-4 text-sm">{formatDate(m.measurement_date)}</td>
                <td className="p-4 font-medium">{m.phase}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${m.measured_percentage}%` }} />
                    </div>
                    <span className="text-sm">{Number(m.measured_percentage).toFixed(1)}%</span>
                  </div>
                </td>
                <td className="p-4">{formatCurrency(Number(m.measured_value))}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(m.status)}`}>{statusLabel(m.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Schedule Tab ──────────────────────────
function ScheduleTab({ schedule, scheduleChart }: { schedule: any[]; scheduleChart: any[] }) {
  return (
    <div className="space-y-4">
      {schedule.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada no cronograma</p>
      ) : (
        <>
          <BudgetVsActualChart data={scheduleChart} />
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4">Etapa</th><th className="p-4">Custo Planejado</th><th className="p-4">Custo Real</th><th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-accent/50">
                    <td className="p-4 font-medium">{s.phase_name}</td>
                    <td className="p-4">{formatCurrency(Number(s.planned_cost))}</td>
                    <td className="p-4">{formatCurrency(Number(s.actual_cost))}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(s.status)}`}>{statusLabel(s.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
