"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', client_name: '', client_cnpj: '', address: '',
    contract_value: '', estimated_budget: '', start_date: '',
    expected_end_date: '', status: 'planning', notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contract_value: parseFloat(form.contract_value) || 0,
          estimated_budget: parseFloat(form.estimated_budget) || 0,
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar obra')
      toast.success('Obra criada com sucesso!')
      router.push('/projetos')
    } catch (err) {
      toast.error('Erro ao criar obra')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Nova Obra</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nome da Obra *</label>
            <input required value={form.name} onChange={set('name')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Cliente</label>
            <input value={form.client_name} onChange={set('client_name')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">CNPJ do Cliente</label>
            <input value={form.client_cnpj} onChange={set('client_cnpj')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Endereço</label>
            <input value={form.address} onChange={set('address')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Valor do Contrato (R$)</label>
            <input type="number" step="0.01" value={form.contract_value} onChange={set('contract_value')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Orçamento Previsto (R$)</label>
            <input type="number" step="0.01" value={form.estimated_budget} onChange={set('estimated_budget')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Data de Início</label>
            <input type="date" value={form.start_date} onChange={set('start_date')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Previsão de Conclusão</label>
            <input type="date" value={form.expected_end_date} onChange={set('expected_end_date')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select value={form.status} onChange={set('status')}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="planning">Planejamento</option>
              <option value="execution">Em Execução</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Observações</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            className="w-full mt-1 px-3 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition">
            {loading ? 'Salvando...' : 'Criar Obra'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-accent transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
