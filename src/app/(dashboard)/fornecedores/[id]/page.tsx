"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { ArrowLeft, Star, Phone, Mail, MapPin, Pencil, Trash2, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SupplierDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [supplier, setSupplier] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', document: '', phone: '', email: '', address: '', category: '', rating: 0 })
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/suppliers/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/expenses?supplier_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/purchases?supplier_id=${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([s, e, p]) => {
      setSupplier(s)
      if (Array.isArray(e)) setExpenses(e)
      if (Array.isArray(p)) setPurchases(p)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /></div>
  if (!supplier) return <p>Fornecedor não encontrado</p>

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalOrders = purchases.length

  const openEdit = () => {
    setEditForm({
      name: supplier.name || '',
      document: supplier.cnpj_cpf || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      category: supplier.category || '',
      rating: supplier.rating || 0,
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success('Fornecedor atualizado!')
        setShowEditModal(false)
        loadData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao atualizar fornecedor')
      }
    } catch {
      toast.error('Erro de rede ao atualizar fornecedor')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) return
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Fornecedor excluído!')
        router.push('/fornecedores')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao excluir fornecedor')
      }
    } catch {
      toast.error('Erro de rede ao excluir fornecedor')
    }
  }

  return (
    <div className="space-y-6">
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Editar Fornecedor</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">CNPJ/CPF</label>
                  <input value={editForm.document} onChange={e => setEditForm(p => ({ ...p, document: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <input value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço</label>
                  <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Avaliação</label>
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button" onClick={() => setEditForm(p => ({ ...p, rating: i }))}
                        className="p-0.5">
                        <Star size={20} className={i <= editForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/fornecedores" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">{supplier.category || 'Sem categoria'}</p>
        </div>
        <div className="flex gap-0.5 mr-3">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={20} className={i <= supplier.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent border text-sm">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Gasto</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pedidos de Compra</p>
          <p className="text-xl font-bold mt-1">{totalOrders}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lançamentos</p>
          <p className="text-xl font-bold mt-1">{expenses.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">CNPJ/CPF</p>
          <p className="text-lg font-medium mt-1">{supplier.cnpj_cpf || '-'}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-3">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-muted-foreground" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-muted-foreground" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-muted-foreground" />
              <span>{supplier.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expenses history */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-3">Histórico de Despesas</h3>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma despesa vinculada a este fornecedor</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-3">Descrição</th>
                <th className="p-3">Obra</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id} className="border-b hover:bg-accent/50">
                  <td className="p-3 font-medium">{e.description}</td>
                  <td className="p-3 text-sm">
                    {e.project ? <Link href={`/projetos/${e.project.id}`} className="text-primary hover:underline">{e.project.name}</Link> : '-'}
                  </td>
                  <td className="p-3">{formatCurrency(Number(e.amount))}</td>
                  <td className="p-3 text-sm">{formatDate(e.date)}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(e.payment_status)}`}>{statusLabel(e.payment_status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
