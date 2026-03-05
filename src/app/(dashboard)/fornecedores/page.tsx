"use client"

import { useEffect, useState } from "react"
import { Supplier } from "@/lib/types"
import { Truck, Plus, Star, Search } from "lucide-react"
import { toast } from "sonner"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', cnpj_cpf: '', phone: '', email: '', address: '', category: '', rating: 0 })

  useEffect(() => {
    fetch('/api/suppliers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSuppliers(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/suppliers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) {
      const newSupplier = await res.json()
      setSuppliers(prev => [newSupplier, ...prev])
      setShowForm(false)
      setForm({ name: '', cnpj_cpf: '', phone: '', email: '', address: '', category: '', rating: 0 })
      toast.success('Fornecedor cadastrado!')
    }
  }

  const filtered = suppliers.filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="space-y-6">
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
            <input placeholder="CNPJ/CPF" value={form.cnpj_cpf} onChange={e => setForm(p => ({ ...p, cnpj_cpf: e.target.value }))}
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
        <input type="text" placeholder="Buscar fornecedor..." value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card" />
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Nome</th>
              <th className="p-4">CNPJ/CPF</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Truck size={32} className="mx-auto mb-2 opacity-50" />Nenhum fornecedor</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-b hover:bg-accent/50 cursor-pointer" onClick={() => window.location.href = `/fornecedores/${s.id}`}>
                <td className="p-4 font-medium text-primary hover:underline">{s.name}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
