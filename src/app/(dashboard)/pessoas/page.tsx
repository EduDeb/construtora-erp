"use client"

import { useEffect, useState } from "react"
import { Employee } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Users, Plus, Search, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"

export default function PeoplePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', cpf: '', role_function: '', type: 'clt', base_salary: '', phone: '', email: '' })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [editEmployee, setEditEmployee] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', cpf: '', role_function: '', type: 'clt', base_salary: '', phone: '', email: '', active: true })

  const loadData = () => {
    setLoading(true)
    fetch(`/api/employees?page=${page}&per_page=20`)
      .then(async r => {
        setTotalCount(parseInt(r.headers.get('X-Total-Count') || '0'))
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setEmployees(d) })
      .catch(() => toast.error('Erro ao carregar funcionários'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, base_salary: parseFloat(form.base_salary) || 0 }),
    })
    if (res.ok) {
      setShowForm(false)
      toast.success('Funcionário cadastrado!')
      setPage(1)
      loadData()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao cadastrar funcionário')
    }
  }

  const handleEdit = (emp: any) => {
    setEditEmployee(emp)
    setEditForm({ name: emp.name || '', cpf: emp.cpf || '', role_function: emp.role_function || '', type: emp.type || 'clt', base_salary: String(emp.base_salary || ''), phone: emp.phone || '', email: emp.email || '', active: emp.active !== false })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/employees/${editEmployee.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, base_salary: parseFloat(editForm.base_salary) || 0 }),
    })
    if (res.ok) {
      setEditEmployee(null)
      toast.success('Funcionário atualizado!')
      loadData()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao atualizar funcionário')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este funcionário?')) return
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Funcionário excluído!')
        loadData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao excluir funcionário')
      }
    } catch {
      toast.error('Erro de rede ao excluir funcionário')
    }
  }

  const handleFilterChange = (value: string) => {
    setFilter(value)
    setPage(1)
  }

  const typeLabels: Record<string, string> = { clt: 'CLT', pj: 'PJ', freelancer: 'Freelancer' }
  const filtered = employees.filter(e => !filter || e.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="space-y-6">
      {editEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Editar Funcionário</h3>
              <button onClick={() => setEditEmployee(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required placeholder="Nome *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="CPF" value={editForm.cpf} onChange={e => setEditForm(p => ({ ...p, cpf: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Função" value={editForm.role_function} onChange={e => setEditForm(p => ({ ...p, role_function: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background">
                  <option value="clt">CLT</option>
                  <option value="pj">PJ</option>
                  <option value="freelancer">Freelancer</option>
                </select>
                <input type="number" step="0.01" placeholder="Salário Base" value={editForm.base_salary}
                  onChange={e => setEditForm(p => ({ ...p, base_salary: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Telefone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
                <input placeholder="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="px-3 py-2 rounded-lg border bg-background" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(p => ({ ...p, active: e.target.checked }))}
                    className="rounded border" />
                  <span className="text-sm font-medium">Ativo</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Salvar</button>
                <button type="button" onClick={() => setEditEmployee(null)} className="px-6 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <input placeholder="Buscar..." value={filter} onChange={e => handleFilterChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card" />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Nome</th>
              <th className="p-4">Função</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Salário Base</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Users size={32} className="mx-auto mb-2 opacity-50" />Nenhum funcionário</td></tr>
            ) : filtered.map(emp => (
              <tr key={emp.id} className="border-b hover:bg-accent/50">
                <td className="p-4 font-medium">{emp.name}</td>
                <td className="p-4 text-sm">{emp.role_function || '-'}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{typeLabels[emp.type]}</span></td>
                <td className="p-4">{formatCurrency(Number(emp.base_salary))}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${emp.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>{emp.active ? 'Ativo' : 'Inativo'}</span></td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(emp)} className="p-1.5 rounded hover:bg-accent" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="Excluir">
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
