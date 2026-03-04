"use client"

import { cn, formatCurrency } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number
  format?: 'currency' | 'number' | 'percent'
  className?: string
}

export function KpiCard({ title, value, icon: Icon, trend, format = 'currency', className }: KpiCardProps) {
  const formatted = format === 'currency'
    ? formatCurrency(value)
    : format === 'percent'
    ? `${value.toFixed(1)}%`
    : value.toLocaleString('pt-BR')

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{formatted}</p>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-xs",
            trend >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend).toFixed(1)}% vs mês anterior</span>
          </div>
        )}
      </div>
    </div>
  )
}
