"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { CostByCategoryChart } from "@/components/charts/cost-by-category-chart"
import { BudgetVsActualChart } from "@/components/charts/budget-vs-actual-chart"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}/summary`).then(r => r.json()),
      fetch(`/api/expenses?project_id=${id}`).then(r => r.json()),
      fetch(`/api/revenues?project_id=${id}`).then(r => r.json()),
    ]).then(([summary, exp, rev]) => {
      setData(summary)
      setExpenses(exp)
      setRevenues(rev)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded" /></div>
  if (!data?.project) return <p>Obra não encontrada</p>

  const { project, totalSpent, totalReceived, totalRevenue, profit, budgetUsed, costsByCategory, schedule } = data

  const tabs = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'costs', label: 'Custos' },
    { key: 'revenue', label: 'Receitas' },
    { key: 'schedule', label: 'Cronograma' },
  ]

  const scheduleChart = (schedule || []).map((s: any) => ({
    phase: s.phase_name,
    planejado: Number(s.planned_cost),
    realizado: Number(s.actual_cost),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projetos" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.client_name || 'Sem cliente'} • {project.address || ''}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusColor(project.status)}`}>
          {statusLabel(project.status)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Progresso da Obra</span>
          <span className="font-medium">{project.completion_percentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${project.completion_percentage}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Contrato</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(Number(project.contract_value))}</p>
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
              <p className="mt-1">{formatDate(project.start_date)} → {formatDate(project.expected_end_date)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostByCategoryChart data={costsByCategory} />
            {scheduleChart.length > 0 && <BudgetVsActualChart data={scheduleChart} />}
          </div>
        </div>
      )}

      {tab === 'costs' && (
        <div className="rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Data</th>
                <th className="p-4">Status</th>
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
      )}

      {tab === 'revenue' && (
        <div className="rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Descrição</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Data Prevista</th>
                <th className="p-4">Status</th>
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
      )}

      {tab === 'schedule' && (
        <div className="space-y-4">
          {schedule.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada no cronograma</p>
          ) : (
            <>
              <BudgetVsActualChart data={scheduleChart} />
              <div className="rounded-xl border bg-card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="p-4">Etapa</th>
                      <th className="p-4">Custo Planejado</th>
                      <th className="p-4">Custo Real</th>
                      <th className="p-4">Status</th>
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
      )}
    </div>
  )
}
