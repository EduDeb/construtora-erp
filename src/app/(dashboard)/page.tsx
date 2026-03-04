"use client"

import { useEffect, useState } from "react"
import { KpiCard } from "@/components/kpi-card"
import { RevenueExpenseChart } from "@/components/charts/revenue-expense-chart"
import { CashFlowChart } from "@/components/charts/cashflow-chart"
import { DashboardOverview } from "@/lib/types"
import { formatCurrency, statusColor, statusLabel } from "@/lib/utils"
import {
  DollarSign, TrendingDown, TrendingUp, Wallet,
  CreditCard, Receipt, Building2, Shield
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [cashflow, setCashflow] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/overview').then(r => r.json()),
      fetch('/api/dashboard/cashflow').then(r => r.json()),
    ]).then(([overview, cf]) => {
      setData(overview)
      setCashflow(cf)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <p>Erro ao carregar dashboard</p>

  const chartData = cashflow.map((c: any) => ({
    month: c.month,
    receitas: c.receitas,
    despesas: c.despesas,
  }))

  const cashflowData = cashflow.map((c: any) => ({
    month: c.month,
    saldo: c.saldo,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {data.pendingAlerts > 0 && (
          <Link href="/auditoria" className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition">
            <Shield size={18} />
            <span className="font-medium">{data.pendingAlerts} alerta(s) pendente(s)</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Faturamento" value={data.totalRevenue} icon={DollarSign} />
        <KpiCard title="Custos" value={data.totalExpenses} icon={TrendingDown} />
        <KpiCard title="Lucro" value={data.profit} icon={TrendingUp} />
        <KpiCard title="Saldo Caixa" value={data.cashBalance} icon={Wallet} />
        <KpiCard title="A Pagar" value={data.payables} icon={CreditCard} />
        <KpiCard title="A Receber" value={data.receivables} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart data={chartData} />
        <CashFlowChart data={cashflowData} />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Obras Ativas</h3>
          <Link href="/projetos" className="text-sm text-primary hover:underline">Ver todas →</Link>
        </div>
        {data.projects.filter(p => p.status === 'execution').length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma obra em execução</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.projects.filter(p => p.status === 'execution').map(proj => (
              <Link key={proj.id} href={`/projetos/${proj.id}`} className="border rounded-lg p-4 hover:border-primary transition">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={18} className="text-muted-foreground" />
                  <h4 className="font-medium truncate">{proj.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrato</span>
                    <span className="font-medium">{formatCurrency(Number(proj.contract_value))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gasto</span>
                    <span>{formatCurrency(proj.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lucro</span>
                    <span className={proj.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(proj.profit)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{proj.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${proj.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
