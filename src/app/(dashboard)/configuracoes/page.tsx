"use client"

import { useEffect, useState } from "react"
import { CostCategory } from "@/lib/types"
import { Settings, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [newCat, setNewCat] = useState({ name: '', type: 'direct' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCategories(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Nome</span>
            <span className="font-medium">DEB Construtora</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">CNPJ</span>
            <span>00.000.000/0001-00</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Localização</span>
            <span>Fortaleza, CE</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Email</span>
            <span>contato@debconstrutora.com.br</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Categorias de Custo</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent">
              <div className="flex items-center gap-3">
                <span className="font-medium">{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${cat.type === 'direct' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}`}>
                  {cat.type === 'direct' ? 'Direto' : 'Indireto'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
