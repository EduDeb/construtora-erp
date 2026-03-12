"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { CashFlowChart } from "@/components/charts/cashflow-chart"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import Link from "next/link"

function ExpenseForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '', date: new Date().toISOString().split('T')[0],
    due_date: '', project_id: '', category_id: '', supplier_id: '',
    payment_method: '', notes: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()).catch(() => [] as any[]),
      fetch('/api/categories').then(r => r.json()).catch(() => [] as any[]),
      fetch('/api/suppliers').then(r => r.json()).catch(() => [] as any[]),
    ]).then(([p, c, s]) => {
      if (Array.isArray(p)) setProjects(p)
      if (Array.isArray(c)) setCategories(c)
      if (Array.isArray(s)) setSuppliers(s)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount) || 0,
        project_id: form.project_id || null,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
      }),
    })
    if (res.ok) { toast.success('Despesa registrada!'); onSave(); onClose() }
    else toast.error('Erro ao registrar')
    setLoading(false)
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Nova Despesa</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Descrição *</label>
              <input required value={form.description} onChange={set('description')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="Ex: Concreto usinado - Fundação" />
            </div>
            <div>
              <label className="text-sm font-medium">Valor (R$) *</label>
              <input required type="number" step="0.01" value={form.amount} onChange={set('amount')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="0,00" />
            </div>
            <div>
              <label className="text-sm font-medium">Obra</label>
              <select value={form.project_id} onChange={set('project_id')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Sem vínculo (administrativo)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select value={form.category_id} onChange={set('category_id')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Fornecedor</label>
              <select value={form.supplier_id} onChange={set('supplier_id')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Data</label>
              <input type="date" value={form.date} onChange={set('date')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Vencimento</label>
              <input type="date" value={form.due_date} onChange={set('due_date')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <select value={form.payment_method} onChange={set('payment_method')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar...</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
                <option value="cartao">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Registrar Despesa'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RevenueForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '', expected_date: '', client_name: '',
    project_id: '', installment_number: '', total_installments: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).catch(() => setProjects([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/revenues', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount) || 0,
        project_id: form.project_id || null,
        installment_number: parseInt(form.installment_number) || null,
        total_installments: parseInt(form.total_installments) || null,
      }),
    })
    if (res.ok) { toast.success('Receita registrada!'); onSave(); onClose() }
    else toast.error('Erro ao registrar')
    setLoading(false)
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Nova Receita</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Descrição *</label>
              <input required value={form.description} onChange={set('description')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="Ex: 1ª Medição - Fundação" />
            </div>
            <div>
              <label className="text-sm font-medium">Valor (R$) *</label>
              <input required type="number" step="0.01" value={form.amount} onChange={set('amount')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <input value={form.client_name} onChange={set('client_name')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Obra</label>
              <select value={form.project_id} onChange={set('project_id')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Data Prevista</label>
              <input type="date" value={form.expected_date} onChange={set('expected_date')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Parcela Nº</label>
              <input type="number" value={form.installment_number} onChange={set('installment_number')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="1" />
            </div>
            <div>
              <label className="text-sm font-medium">Total de Parcelas</label>
              <input type="number" value={form.total_installments} onChange={set('total_installments')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="6" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Registrar Receita'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialTab = searchParams?.get('tab') || 'payables'
  const [tab, setTab] = useState(initialTab)
  const [expenses, setExpenses] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [cashflow, setCashflow] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [expensePage, setExpensePage] = useState(1)
  const [expenseTotalCount, setExpenseTotalCount] = useState(0)
  const [revenuePage, setRevenuePage] = useState(1)
  const [revenueTotalCount, setRevenueTotalCount] = useState(0)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/expenses?page=${expensePage}&per_page=20`).then(async r => {
        const totalCount = parseInt(r.headers.get('X-Total-Count') || '0')
        setExpenseTotalCount(totalCount)
        return r.json()
      }).catch(() => [] as any[]),
      fetch(`/api/revenues?page=${revenuePage}&per_page=20`).then(async r => {
        const totalCount = parseInt(r.headers.get('X-Total-Count') || '0')
        setRevenueTotalCount(totalCount)
        return r.json()
      }).catch(() => [] as any[]),
      fetch('/api/dashboard/cashflow').then(r => r.json()).catch(() => [] as any[]),
    ]).then(([exp, rev, cf]) => {
      if (Array.isArray(exp)) setExpenses(exp)
      if (Array.isArray(rev)) setRevenues(rev)
      if (Array.isArray(cf)) setCashflow(cf)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [expensePage, revenuePage])

  const markAsPaid = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) { toast.success('Marcado como pago!'); loadData() }
  }

  const markAsReceived = async (id: string) => {
    const res = await fetch(`/api/revenues/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'received', received_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) { toast.success('Marcado como recebido!'); loadData() }
  }

  const tabs = [
    { key: 'payables', label: 'Contas a Pagar' },
    { key: 'receivables', label: 'Contas a Receber' },
    { key: 'cashflow', label: 'Fluxo de Caixa' },
  ]

  const pendingExpenses = expenses.filter(e => e.payment_status === 'pending' || e.payment_status === 'overdue')
  const pendingRevenues = revenues.filter(r => r.status === 'pending' || r.status === 'overdue')

  // Summary cards
  const totalPayables = pendingExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalReceivables = pendingRevenues.reduce((s, r) => s + Number(r.amount), 0)
  const overduePayables = expenses.filter(e => e.payment_status === 'overdue').reduce((s, e) => s + Number(e.amount), 0)
  const overdueReceivables = revenues.filter(r => r.status === 'overdue').reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="space-y-6">
      {showExpenseForm && <ExpenseForm onClose={() => setShowExpenseForm(false)} onSave={loadData} />}
      {showRevenueForm && <RevenueForm onClose={() => setShowRevenueForm(false)} onSave={loadData} />}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
            <Plus size={18} /> Despesa
          </button>
          <button onClick={() => setShowRevenueForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20">
            <Plus size={18} /> Receita
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">A Pagar</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(totalPayables)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingExpenses.length} pendentes</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">A Receber</p>
          <p className="text-xl font-bold text-green-500 mt-1">{formatCurrency(totalReceivables)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingRevenues.length} pendentes</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencido (Pagar)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(overduePayables)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencido (Receber)</p>
          <p className="text-xl font-bold text-orange-500 mt-1">{formatCurrency(overdueReceivables)}</p>
        </div>
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
        <>
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Obra</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Fornecedor</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center">Carregando...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma despesa registrada. Clique em "+ Despesa" para começar.</td></tr>
                ) : expenses.map((e: any) => (
                  <tr key={e.id} className="border-b hover:bg-accent/50">
                    <td className="p-4 font-medium">{e.description}</td>
                    <td className="p-4 text-sm">{e.project ? <Link href={`/projetos/${e.project.id}`} className="text-primary hover:underline">{e.project.name}</Link> : <span className="text-muted-foreground">Admin</span>}</td>
                    <td className="p-4 text-sm">{e.category?.name || '-'}</td>
                    <td className="p-4 text-sm">{e.supplier ? <Link href={`/fornecedores/${e.supplier.id}`} className="text-primary hover:underline">{e.supplier.name}</Link> : '-'}</td>
                    <td className="p-4 font-medium">{formatCurrency(Number(e.amount))}</td>
                    <td className="p-4 text-sm">{formatDate(e.due_date)}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(e.payment_status)}`}>{statusLabel(e.payment_status)}</span></td>
                    <td className="p-4">
                      {(e.payment_status === 'pending' || e.payment_status === 'overdue') && (
                        <button onClick={() => markAsPaid(e.id)} className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20">Pagar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={expensePage} totalCount={expenseTotalCount} perPage={20} onPageChange={setExpensePage} />
        </>
      )}

      {tab === 'receivables' && (
        <>
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Obra</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Parcela</th>
                  <th className="p-4">Data Prevista</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {revenues.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma receita registrada. Clique em "+ Receita" para começar.</td></tr>
                ) : revenues.map((r: any) => (
                  <tr key={r.id} className="border-b hover:bg-accent/50">
                    <td className="p-4 font-medium">{r.description}</td>
                    <td className="p-4 text-sm">{r.project ? <Link href={`/projetos/${r.project.id}`} className="text-primary hover:underline">{r.project.name}</Link> : '-'}</td>
                    <td className="p-4 text-sm">{r.client_name || '-'}</td>
                    <td className="p-4 font-medium">{formatCurrency(Number(r.amount))}</td>
                    <td className="p-4 text-sm">{r.installment_number && r.total_installments ? `${r.installment_number}/${r.total_installments}` : '-'}</td>
                    <td className="p-4 text-sm">{formatDate(r.expected_date)}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(r.status)}`}>{statusLabel(r.status)}</span></td>
                    <td className="p-4">
                      {(r.status === 'pending' || r.status === 'overdue') && (
                        <button onClick={() => markAsReceived(r.id)} className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20">Receber</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={revenuePage} totalCount={revenueTotalCount} perPage={20} onPageChange={setRevenuePage} />
        </>
      )}

      {tab === 'cashflow' && (
        <CashFlowChart data={cashflow.map((c: any) => ({ month: c.month, saldo: c.saldo }))} />
      )}
    </div>
  )
}
