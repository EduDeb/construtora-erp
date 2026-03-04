"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { CashFlowChart } from "@/components/charts/cashflow-chart"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export default function FinancePage() {
  const [tab, setTab] = useState('payables')
  const [expenses, setExpenses] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [cashflow, setCashflow] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/revenues').then(r => r.json()),
      fetch('/api/dashboard/cashflow').then(r => r.json()),
    ]).then(([exp, rev, cf]) => {
      setExpenses(exp)
      setRevenues(rev)
      setCashflow(cf)
    }).finally(() => setLoading(false))
  }, [])

  const markAsPaid = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) {
      toast.success('Marcado como pago!')
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, payment_status: 'paid' } : e))
    }
  }

  const markAsReceived = async (id: string) => {
    const res = await fetch(`/api/revenues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'received', received_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) {
      toast.success('Marcado como recebido!')
      setRevenues(prev => prev.map(r => r.id === id ? { ...r, status: 'received' } : r))
    }
  }

  const tabs = [
    { key: 'payables', label: 'Contas a Pagar' },
    { key: 'receivables', label: 'Contas a Receber' },
    { key: 'cashflow', label: 'Fluxo de Caixa' },
  ]

  const pendingExpenses = expenses.filter(e => e.payment_status === 'pending' || e.payment_status === 'overdue')
  const pendingRevenues = revenues.filter(r => r.status === 'pending' || r.status === 'overdue')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
            {t.key === 'payables' && pendingExpenses.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingExpenses.length}</span>
            )}
            {t.key === 'receivables' && pendingRevenues.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">{pendingRevenues.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'payables' && (
        <div className="rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Descrição</th>
                <th className="p-4">Obra</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center">Carregando...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma despesa registrada</td></tr>
              ) : expenses.map((e: any) => (
                <tr key={e.id} className="border-b hover:bg-accent/50">
                  <td className="p-4 font-medium">{e.description}</td>
                  <td className="p-4 text-sm">{e.project?.name || '-'}</td>
                  <td className="p-4 text-sm">{e.supplier?.name || '-'}</td>
                  <td className="p-4">{formatCurrency(Number(e.amount))}</td>
                  <td className="p-4 text-sm">{formatDate(e.due_date)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor(e.payment_status)}`}>
                      {statusLabel(e.payment_status)}
                    </span>
                  </td>
                  <td className="p-4">
                    {e.payment_status === 'pending' || e.payment_status === 'overdue' ? (
                      <button onClick={() => markAsPaid(e.id)} className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20">
                        Pagar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'receivables' && (
        <div className="rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Descrição</th>
                <th className="p-4">Obra</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Data Prevista</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {revenues.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma receita registrada</td></tr>
              ) : revenues.map((r: any) => (
                <tr key={r.id} className="border-b hover:bg-accent/50">
                  <td className="p-4 font-medium">{r.description}</td>
                  <td className="p-4 text-sm">{r.project?.name || '-'}</td>
                  <td className="p-4">{formatCurrency(Number(r.amount))}</td>
                  <td className="p-4 text-sm">{formatDate(r.expected_date)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status === 'pending' || r.status === 'overdue' ? (
                      <button onClick={() => markAsReceived(r.id)} className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20">
                        Receber
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cashflow' && (
        <CashFlowChart data={cashflow.map((c: any) => ({ month: c.month, saldo: c.saldo }))} />
      )}
    </div>
  )
}
