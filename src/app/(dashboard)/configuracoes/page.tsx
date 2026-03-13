"use client"

import { useEffect, useState } from "react"
import { CostCategory } from "@/lib/types"
import { Pencil, Trash2, Plus, Save, X, Check } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null)
  const [companyForm, setCompanyForm] = useState({ name: '', cnpj: '', address: '', phone: '', email: '' })
  const [editingCompany, setEditingCompany] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)

  const [categories, setCategories] = useState<CostCategory[]>([])
  const [newCat, setNewCat] = useState({ name: '', type: 'direct' })
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState<any>(null)
  const [editCatForm, setEditCatForm] = useState({ name: '', type: 'direct' })
  const [loading, setLoading] = useState(true)

  const loadCompany = () => {
    fetch('/api/company')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        setCompany(d)
        setCompanyForm({ name: d.name || '', cnpj: d.cnpj || '', address: d.address || '', phone: d.phone || '', email: d.email || '' })
      })
      .catch(() => toast.error('Erro ao carregar dados da empresa'))
  }

  const loadCategories = () => {
    fetch('/api/categories')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { if (Array.isArray(d)) setCategories(d) })
      .catch(() => { setCategories([]); toast.error('Erro ao carregar categorias') })
  }

  useEffect(() => {
    Promise.all([loadCompany(), loadCategories()]).finally(() => setLoading(false))
  }, [])

  const saveCompany = async () => {
    setSavingCompany(true)
    try {
      const res = await fetch('/api/company', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
      })
      if (res.ok) {
        toast.success('Dados da empresa atualizados!')
        setEditingCompany(false)
        loadCompany()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch {
      toast.error('Erro de rede ao salvar dados da empresa')
    }
    setSavingCompany(false)
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    })
    if (res.ok) {
      toast.success('Categoria criada!')
      setNewCat({ name: '', type: 'direct' })
      setShowCatForm(false)
      loadCategories()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao criar categoria')
    }
  }

  const updateCategory = async () => {
    if (!editCat) return
    const res = await fetch(`/api/categories/${editCat.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCatForm),
    })
    if (res.ok) {
      toast.success('Categoria atualizada!')
      setEditCat(null)
      loadCategories()
    } else {
      toast.error('Erro ao atualizar')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Categoria excluída!')
      loadCategories()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao excluir')
    }
  }

  const startEditCat = (cat: CostCategory) => {
    setEditCat(cat)
    setEditCatForm({ name: cat.name, type: cat.type })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Configurações</h1>

      {/* Company Section */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Dados da Empresa</h3>
          {!editingCompany && (
            <button onClick={() => setEditingCompany(true)} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg hover:bg-accent">
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>
        {editingCompany ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">CNPJ</label>
              <input value={companyForm.cnpj} onChange={e => setCompanyForm(p => ({ ...p, cnpj: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <input value={companyForm.address} onChange={e => setCompanyForm(p => ({ ...p, address: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <input value={companyForm.phone} onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input value={companyForm.email} onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveCompany} disabled={savingCompany}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                <Save size={14} /> {savingCompany ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { setEditingCompany(false); if (company) setCompanyForm({ name: company.name || '', cnpj: company.cnpj || '', address: company.address || '', phone: company.phone || '', email: company.email || '' }) }}
                className="px-4 py-2 border rounded-lg hover:bg-accent">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{company?.name || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">CNPJ</span>
              <span>{company?.cnpj || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Endereço</span>
              <span>{company?.address || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Telefone</span>
              <span>{company?.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Email</span>
              <span>{company?.email || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Categorias de Custo</h3>
          <button onClick={() => setShowCatForm(!showCatForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium">
            <Plus size={16} /> Nova Categoria
          </button>
        </div>

        {showCatForm && (
          <form onSubmit={createCategory} className="mb-4 p-4 rounded-lg border bg-accent/30 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input required placeholder="Ex: Materiais, Mão de obra..." value={newCat.name}
                  onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select value={newCat.type} onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="direct">Direto</option>
                  <option value="indirect">Indireto</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Criar Categoria</button>
              <button type="button" onClick={() => setShowCatForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-accent border-b last:border-b-0">
              {editCat?.id === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editCatForm.name} onChange={e => setEditCatForm(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 px-2 py-1 rounded border bg-background text-sm" />
                  <select value={editCatForm.type} onChange={e => setEditCatForm(p => ({ ...p, type: e.target.value }))}
                    className="px-2 py-1 rounded border bg-background text-sm">
                    <option value="direct">Direto</option>
                    <option value="indirect">Indireto</option>
                  </select>
                  <button onClick={updateCategory} className="p-1.5 rounded hover:bg-green-500/10 text-green-500" title="Salvar"><Check size={16} /></button>
                  <button onClick={() => setEditCat(null)} className="p-1.5 rounded hover:bg-accent" title="Cancelar"><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cat.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${cat.type === 'direct' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}`}>
                      {cat.type === 'direct' ? 'Direto' : 'Indireto'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditCat(cat)} className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-accent" title="Editar">
                      <Pencil size={14} /> <span className="hidden md:inline">Editar</span>
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-red-500/10 text-red-500" title="Excluir">
                      <Trash2 size={14} /> <span className="hidden md:inline">Excluir</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Nenhuma categoria cadastrada</p>
              <button onClick={() => setShowCatForm(true)}
                className="text-sm text-primary hover:underline font-medium">
                Clique em "Nova Categoria" acima para começar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Section - keep as is */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Auditoria Automática</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Verificação diária</span>
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Ativo</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Horário</span>
            <span>06:00 (Brasília)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Verificações</span>
            <span>9 regras ativas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
