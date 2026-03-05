"use client"

import { useEffect, useState } from "react"
import { Employee } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Users, Plus, Search } from "lucide-react"
import { toast } from "sonner"

export default function PeoplePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', cpf: '', role_function: '', type: 'clt', base_salary: '', phone: '', email: '' })

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEmployees(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, base_salary: parseFloat(form.base_salary) || 0 }),
    })
    if (res.ok) {
      const emp = await res.json()
      setEmployees(prev => [emp, ...prev])
      setShowForm(false)
      toast.success('Funcionário cadastrado!')
    }
  }

  const typeLabels: Record<string, string> = { clt: 'CLT', pj: 'PJ', freelancer: 'Freelancer' }
  const filtered = employees.filter(e => !filter || e.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pessoas</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required placeholder="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="CPF" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Função" value={form.role_function} onChange={e => setForm(p => ({ ...p, role_function: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background">
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
              <option value="freelancer">Freelancer</option>
            </select>
            <input type="number" step="0.01" placeholder="Salário Base" value={form.base_salary}
              onChange={e => setForm(p => ({ ...p, base_salary: e.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background" />
            <input placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
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
        <input placeholder="Buscar..." value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card" />
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Nome</th>
              <th className="p-4">Função</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Salário Base</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Users size={32} className="mx-auto mb-2 opacity-50" />Nenhum funcionário</td></tr>
            ) : filtered.map(emp => (
              <tr key={emp.id} className="border-b hover:bg-accent/50">
                <td className="p-4 font-medium">{emp.name}</td>
                <td className="p-4 text-sm">{emp.role_function || '-'}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{typeLabels[emp.type]}</span></td>
                <td className="p-4">{formatCurrency(Number(emp.base_salary))}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${emp.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>{emp.active ? 'Ativo' : 'Inativo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
