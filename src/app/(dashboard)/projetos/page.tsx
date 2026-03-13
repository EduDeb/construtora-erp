"use client"

import { useEffect, useState } from "react"
import { Project } from "@/lib/types"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { Building2, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const loadData = () => {
    setLoading(true)
    fetch('/api/projects')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { if (Array.isArray(d)) setProjects(d) })
      .catch(() => { setProjects([]); toast.error('Erro ao carregar obras') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Tem certeza que deseja excluir a obra "${name}"?`)) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Obra excluída!')
        loadData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao excluir obra')
      }
    } catch {
      toast.error('Erro de rede ao excluir obra')
    }
  }

  const filtered = projects.filter(p => {
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Obras</h1>
        <Link href="/projetos/novo" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
          <Plus size={18} />
          Nova Obra
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar obra..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os status</option>
          <option value="planning">Planejamento</option>
          <option value="execution">Em Execução</option>
          <option value="completed">Concluída</option>
          <option value="suspended">Suspensa</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma obra encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <div key={project.id} className="rounded-xl border bg-card hover:border-primary transition flex flex-col">
              <Link href={`/projetos/${project.id}`} className="block p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusColor(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{project.client_name || 'Sem cliente'}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrato</span>
                    <span className="font-medium">{formatCurrency(Number(project.contract_value))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início</span>
                    <span>{formatDate(project.start_date)}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Execução</span>
                      <span>{project.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${project.completion_percentage}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="px-6 pb-4 pt-0 border-t mt-auto">
                <button
                  onClick={(e) => handleDelete(e, project.id, project.name)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition mt-2"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
