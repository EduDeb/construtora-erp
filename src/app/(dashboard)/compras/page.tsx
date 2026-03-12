"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { ShoppingCart, Plus, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"

interface PurchaseItem {
  material_name: string
  quantity: string
  unit: string
  unit_price: string
}

function PurchaseForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: '', project_id: '', supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '', notes: '',
  })
  const [items, setItems] = useState<PurchaseItem[]>([
    { material_name: '', quantity: '1', unit: 'un', unit_price: '' }
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()).catch(() => []),
      fetch('/api/suppliers').then(r => r.json()).catch(() => []),
    ]).then(([p, s]) => {
      if (Array.isArray(p)) setProjects(p)
      if (Array.isArray(s)) setSuppliers(s)
    })
  }, [])

  const addItem = () => setItems(prev => [...prev, { material_name: '', quantity: '1', unit: 'un', unit_price: '' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const totalAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/purchases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        project_id: form.project_id || null,
        supplier_id: form.supplier_id || null,
        total_amount: totalAmount,
        items: items.filter(i => i.material_name).map(i => ({
          material_name: i.material_name,
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit,
          unit_price: parseFloat(i.unit_price) || 0,
          total_price: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0),
        })),
      }),
    })
    if (res.ok) { toast.success('Pedido criado!'); onSave(); onClose() }
    else toast.error('Erro ao criar pedido')
    setLoading(false)
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Novo Pedido de Compra</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Descrição *</label>
              <input required value={form.description} onChange={set('description')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" placeholder="Ex: Material acabamento - Lote 1" />
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
              <label className="text-sm font-medium">Fornecedor</label>
              <select value={form.supplier_id} onChange={set('supplier_id')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background">
                <option value="">Selecionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Data do Pedido</label>
              <input type="date" value={form.order_date} onChange={set('order_date')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Previsão de Entrega</label>
              <input type="date" value={form.expected_delivery} onChange={set('expected_delivery')}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Itens do Pedido</label>
              <button type="button" onClick={addItem} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                + Adicionar Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="text-xs text-muted-foreground">Material</label>}
                    <input placeholder="Nome do material" value={item.material_name}
                      onChange={e => updateItem(i, 'material_name', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border bg-background text-sm" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs text-muted-foreground">Qtd</label>}
                    <input type="number" step="0.01" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border bg-background text-sm" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs text-muted-foreground">Unidade</label>}
                    <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border bg-background text-sm">
                      <option value="un">un</option>
                      <option value="m">m</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="lata">lata</option>
                      <option value="saco">saco</option>
                      <option value="peça">peça</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs text-muted-foreground">Valor Unit.</label>}
                    <input type="number" step="0.01" placeholder="0,00" value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border bg-background text-sm" />
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <label className="text-xs text-muted-foreground">Total</label>}
                    <p className="py-2 text-sm font-medium">
                      {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                    </p>
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t">
              <p className="text-lg font-bold">Total: {formatCurrency(totalAmount)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Criar Pedido'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const loadData = () => {
    setLoading(true)
    fetch(`/api/purchases?page=${page}&per_page=20`)
      .then(async r => {
        setTotalCount(parseInt(r.headers.get('X-Total-Count') || '0'))
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setPurchases(d) })
      .catch(() => toast.error('Erro ao carregar pedidos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [page])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/purchases/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { toast.success(`Status atualizado!`); loadData() }
  }

  const statusFlow: Record<string, { next: string; label: string }> = {
    draft: { next: 'approved', label: 'Aprovar' },
    approved: { next: 'ordered', label: 'Marcar Pedido' },
    ordered: { next: 'delivered', label: 'Confirmar Entrega' },
  }

  // Summary
  const totalPending = purchases.filter(p => p.status !== 'delivered' && p.status !== 'cancelled')
    .reduce((s, p) => s + Number(p.total_amount), 0)

  return (
    <div className="space-y-6">
      {showForm && <PurchaseForm onClose={() => setShowForm(false)} onSave={() => { setPage(1); loadData() }} />}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Novo Pedido
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Pedidos</p>
          <p className="text-xl font-bold mt-1">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-xl font-bold mt-1 text-yellow-500">{purchases.filter(p => p.status === 'draft' || p.status === 'approved').length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Em Trânsito</p>
          <p className="text-xl font-bold mt-1 text-blue-500">{purchases.filter(p => p.status === 'ordered').length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Valor Total Pendente</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Descrição</th>
              <th className="p-4">Obra</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4">Itens</th>
              <th className="p-4">Valor Total</th>
              <th className="p-4">Data</th>
              <th className="p-4">Entrega</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center">Carregando...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido de compra</p>
                <p className="text-sm mt-1">Clique em "Novo Pedido" para começar</p>
              </td></tr>
            ) : purchases.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-accent/50">
                <td className="p-4 font-medium">{p.description || '-'}</td>
                <td className="p-4 text-sm">
                  {p.project ? <Link href={`/projetos/${p.project.id}`} className="text-primary hover:underline">{p.project.name}</Link> : '-'}
                </td>
                <td className="p-4 text-sm">
                  {p.supplier ? <Link href={`/fornecedores/${p.supplier.id}`} className="text-primary hover:underline">{p.supplier.name}</Link> : '-'}
                </td>
                <td className="p-4 text-sm">{p.items?.length || 0} itens</td>
                <td className="p-4 font-medium">{formatCurrency(Number(p.total_amount))}</td>
                <td className="p-4 text-sm">{formatDate(p.order_date)}</td>
                <td className="p-4 text-sm">{formatDate(p.expected_delivery)}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(p.status)}`}>{statusLabel(p.status)}</span></td>
                <td className="p-4">
                  {statusFlow[p.status] && (
                    <button onClick={() => updateStatus(p.id, statusFlow[p.status].next)}
                      className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                      {statusFlow[p.status].label}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalCount={totalCount} perPage={20} onPageChange={setPage} />
    </div>
  )
}
