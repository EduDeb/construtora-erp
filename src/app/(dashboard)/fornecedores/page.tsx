"use client"

import { useEffect, useState } from "react"
import { Supplier } from "@/lib/types"
import { Truck, Plus, Star, Search, Pencil, Trash2, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', document: '', phone: '', email: '', address: '', category: '', rating: 0 })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [editSupplier, setEditSupplier] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', document: '', phone: '', email: '', address: '', category: '', rating: 0 })

  const loadData = () => {
    setLoading(true)
    fetch(`/api/suppliers?page=${page}&per_page=20`)
      .then(async r => {
        setTotalCount(parseInt(r.headers.get('X-Total-Count') || '0'))
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setSuppliers(d) })
      .catch(() => toast.error('Erro ao carregar fornecedores'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/suppliers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', document: '', phone: '', email: '', address: '', category: '', rating: 0 })
      toast.success('Fornecedor cadastrado!')
      setPage(1)
      loadData()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao cadastrar fornecedor')
    }
  }

  const handleEdit = (s: any) => {
    setEditSupplier(s)
    setEditForm({ name: s.name || '', document: s.cnpj_cpf || '', phone: s.phone || '', email: s.email || '', address: s.address || '', category: s.category || '', rating: s.rating || 0 })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/suppliers/${editSupplier.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setEditSupplier(null)
      toast.success('Fornecedor atualizado!')
      loadData()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao atualizar fornecedor')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Fornecedor excluído!')
      loadData()
    } else {
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const handleFilterChange = (value: string) => {
    setFilter(value)
    setPage(1)
  }

  const filtered = suppliers.filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="space-y-6">
      {editSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Editar Fornecedor</h3>
              <button onClick={() => setEditSupplier(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required placeholder="Nome *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="CNPJ/CPF" value={editForm.document} onChange={e => setEditForm(p => ({ ...p, document: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Telefone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Categoria" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Endereço" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Salvar</button>
                <button type="button" onClick={() => setEditSupplier(null)} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required placeholder="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="CNPJ/CPF" value={form.document} onChange={e => setForm(p => ({ ...p, document: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Categoria" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Endereço" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input type="text" placeholder="Buscar fornecedor..." value={filter} onChange={e => handleFilterChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card" />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Nome</th>
              <th className="p-4">CNPJ/CPF</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Avaliação</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Truck size={32} className="mx-auto mb-2 opacity-50" />Nenhum fornecedor</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-b hover:bg-accent/50 cursor-pointer">
                <td className="p-4 font-medium text-primary hover:underline">
                  <Link href={`/fornecedores/${s.id}`}>{s.name}</Link>
                </td>
                <td className="p-4 text-sm">{s.cnpj_cpf || '-'}</td>
                <td className="p-4 text-sm">{s.phone || '-'}</td>
                <td className="p-4 text-sm">{s.category || '-'}</td>
                <td className="p-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={i <= s.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(s)} className="p-1.5 rounded hover:bg-accent" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
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
