"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { ShoppingCart } from "lucide-react"

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/purchases').then(r => r.json()).then(setPurchases).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pedidos de Compra</h1>

      <div className="rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Descrição</th>
              <th className="p-4">Obra</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4">Valor Total</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
              <th className="p-4">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center">Carregando...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />Nenhum pedido
              </td></tr>
            ) : purchases.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-accent/50">
                <td className="p-4 font-medium">{p.description || '-'}</td>
                <td className="p-4 text-sm">{p.project?.name || '-'}</td>
                <td className="p-4 text-sm">{p.supplier?.name || '-'}</td>
                <td className="p-4">{formatCurrency(Number(p.total_amount))}</td>
                <td className="p-4 text-sm">{formatDate(p.order_date)}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(p.status)}`}>{statusLabel(p.status)}</span></td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(p.payment_status)}`}>{statusLabel(p.payment_status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
