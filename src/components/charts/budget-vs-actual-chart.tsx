"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PhaseData {
  phase: string
  planejado: number
  realizado: number
}

export function BudgetVsActualChart({ data }: { data: PhaseData[] }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Planejado vs Realizado</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="phase" className="text-xs" />
          <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} className="text-xs" />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          />
          <Legend />
          <Bar dataKey="planejado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Planejado" />
          <Bar dataKey="realizado" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Realizado" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
