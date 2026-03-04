"use client"

import { useEffect, useState } from "react"
import { AuditAlert, AuditLog } from "@/lib/types"
import { formatDate, statusColor, statusLabel } from "@/lib/utils"
import { Shield, AlertTriangle, AlertCircle, Info, CheckCircle, Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const severityIcon = (s: string) => {
  switch (s) {
    case 'critical': return <AlertTriangle size={18} className="text-red-500" />
    case 'warning': return <AlertCircle size={18} className="text-yellow-500" />
    default: return <Info size={18} className="text-blue-500" />
  }
}

export default function AuditPage() {
  const [alerts, setAlerts] = useState<AuditAlert[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tab, setTab] = useState('alerts')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/audit/alerts').then(r => r.json()),
      fetch('/api/audit/log?limit=100').then(r => r.json()),
    ]).then(([a, l]) => {
      setAlerts(a)
      setLogs(l)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const runCheck = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/audit/check', { method: 'POST' })
      const result = await res.json()
      toast.success(`Verificação concluída: ${result.newAlerts} novos alertas encontrados`)
      loadData()
    } catch {
      toast.error('Erro na verificação')
    } finally {
      setChecking(false)
    }
  }

  const updateAlert = async (id: string, status: string) => {
    const res = await fetch('/api/audit/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      toast.success(`Alerta ${statusLabel(status).toLowerCase()}`)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a))
    }
  }

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false
    if (severityFilter && a.severity !== severityFilter) return false
    return true
  })

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'pending').length
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'pending').length
  const infoCount = alerts.filter(a => a.severity === 'info' && a.status === 'pending').length

  const actionLabels: Record<string, string> = { insert: 'Criação', update: 'Alteração', delete: 'Exclusão' }
  const tableLabels: Record<string, string> = {
    expenses: 'Despesas', revenues: 'Receitas', payroll: 'Folha', purchase_orders: 'Compras', projects: 'Obras'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Auditoria</h1>
        <button onClick={runCheck} disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
          <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Verificando...' : 'Executar Verificação'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="text-red-500" size={24} /></div>
          <div>
            <p className="text-2xl font-bold">{criticalCount}</p>
            <p className="text-sm text-muted-foreground">Críticos</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10"><AlertCircle className="text-yellow-500" size={24} /></div>
          <div>
            <p className="text-2xl font-bold">{warningCount}</p>
            <p className="text-sm text-muted-foreground">Atenção</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><Info className="text-blue-500" size={24} /></div>
          <div>
            <p className="text-2xl font-bold">{infoCount}</p>
            <p className="text-sm text-muted-foreground">Informativos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button onClick={() => setTab('alerts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === 'alerts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
          Alertas
        </button>
        <button onClick={() => setTab('log')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === 'log' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
          Histórico de Alterações
        </button>
      </div>

      {tab === 'alerts' && (
        <>
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-card text-sm">
              <option value="">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="reviewed">Revisados</option>
              <option value="resolved">Resolvidos</option>
              <option value="dismissed">Descartados</option>
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-card text-sm">
              <option value="">Todas severidades</option>
              <option value="critical">🔴 Crítico</option>
              <option value="warning">🟡 Atenção</option>
              <option value="info">🔵 Info</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum alerta encontrado</p>
              </div>
            ) : filteredAlerts.map(alert => (
              <div key={alert.id} className={`rounded-xl border bg-card p-4 flex items-start gap-4 ${alert.status === 'pending' ? 'border-l-4' : ''} ${alert.severity === 'critical' && alert.status === 'pending' ? 'border-l-red-500' : alert.severity === 'warning' && alert.status === 'pending' ? 'border-l-yellow-500' : alert.status === 'pending' ? 'border-l-blue-500' : ''}`}>
                {severityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(alert.severity)}`}>
                      {statusLabel(alert.severity)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(alert.status)}`}>
                      {statusLabel(alert.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.created_at)}</p>
                </div>
                {alert.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateAlert(alert.id, 'reviewed')}
                      className="p-2 rounded-lg hover:bg-accent" title="Marcar como revisado">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => updateAlert(alert.id, 'resolved')}
                      className="p-2 rounded-lg hover:bg-green-500/10 text-green-500" title="Resolver">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => updateAlert(alert.id, 'dismissed')}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Descartar">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'log' && (
        <div className="rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Data</th>
                <th className="p-4">Tabela</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma alteração registrada</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-accent/50">
                  <td className="p-4 text-sm">{formatDate(log.created_at)}</td>
                  <td className="p-4 text-sm font-medium">{tableLabels[log.table_name] || log.table_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${log.action === 'insert' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : log.action === 'update' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {actionLabels[log.action]}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground max-w-md truncate">
                    {log.action === 'update' && log.old_values && log.new_values ? (
                      <span>Campos alterados: {Object.keys(log.new_values).filter(k => JSON.stringify((log.old_values as any)?.[k]) !== JSON.stringify((log.new_values as any)?.[k]) && k !== 'updated_at').join(', ') || 'n/a'}</span>
                    ) : log.action === 'insert' ? (
                      <span>Novo registro criado</span>
                    ) : (
                      <span>Registro removido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
