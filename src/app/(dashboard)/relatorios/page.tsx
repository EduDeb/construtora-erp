"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { FileBarChart, Download } from "lucide-react"

export default function ReportsPage() {
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then(r => r.json())
      .then(d => { if (d && d.totalRevenue !== undefined) setOverview(d) })
      .catch(() => setOverview(null))
      .finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    if (!overview?.projects) return
    const headers = 'Obra,Contrato,Gasto,Recebido,Lucro,Execução (%),Status\n'
    const rows = overview.projects.map((p: any) =>
      `"${p.name}",${p.contract_value},${p.totalSpent},${p.totalReceived},${p.profit},${p.completion_percentage},${p.status}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-obras-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded" /></div>

  if (!overview) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>
      <p className="text-muted-foreground">Nenhum dado disponível ainda. Cadastre obras e lançamentos para gerar relatórios.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      {/* DRE Simplificado */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">DRE Simplificado — Consolidado</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Receita Bruta</span>
            <span className="font-bold">{formatCurrency(overview?.totalRevenue || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-red-500">(-) Custos Totais</span>
            <span className="font-bold text-red-500">{formatCurrency(overview?.totalExpenses || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b bg-accent/50 px-2 rounded">
            <span className="font-bold text-lg">= Lucro Bruto</span>
            <span className={`font-bold text-lg ${(overview?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(overview?.profit || 0)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Margem de Lucro</span>
            <span className="font-medium">{(overview?.profitMargin || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* DRE por Obra */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Resultado por Obra</h3>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-3">Obra</th>
              <th className="p-3">Contrato</th>
              <th className="p-3">Custos</th>
              <th className="p-3">Recebido</th>
              <th className="p-3">Lucro</th>
              <th className="p-3">Margem</th>
              <th className="p-3">Execução</th>
            </tr>
          </thead>
          <tbody>
            {(overview?.projects || []).map((p: any) => {
              const margin = Number(p.contract_value) > 0 ? ((p.profit / Number(p.contract_value)) * 100) : 0
              return (
                <tr key={p.id} className="border-b hover:bg-accent/50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{formatCurrency(Number(p.contract_value))}</td>
                  <td className="p-3 text-red-500">{formatCurrency(p.totalSpent)}</td>
                  <td className="p-3">{formatCurrency(p.totalReceived)}</td>
                  <td className={`p-3 font-medium ${p.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(p.profit)}</td>
                  <td className="p-3">{margin.toFixed(1)}%</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2" style={{ width: `${p.completion_percentage}%` }} />
                      </div>
                      <span className="text-sm">{p.completion_percentage}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Posição Financeira</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span>Saldo em Caixa</span>
              <span className="font-bold">{formatCurrency(overview?.cashBalance || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Contas a Receber</span>
              <span className="font-bold text-green-500">{formatCurrency(overview?.receivables || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Contas a Pagar</span>
              <span className="font-bold text-red-500">{formatCurrency(overview?.payables || 0)}</span>
            </div>
            <div className="flex justify-between py-2 bg-accent/50 px-2 rounded">
              <span className="font-bold">Posição Líquida</span>
              <span className="font-bold">{formatCurrency((overview?.cashBalance || 0) + (overview?.receivables || 0) - (overview?.payables || 0))}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo Operacional</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span>Obras Ativas</span>
              <span className="font-bold">{overview?.activeProjects || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Total de Obras</span>
              <span className="font-bold">{overview?.projects?.length || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Alertas Pendentes</span>
              <span className="font-bold text-red-500">{overview?.pendingAlerts || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
