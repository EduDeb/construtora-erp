"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { formatCurrency, formatDate, statusColor, statusLabel } from "@/lib/utils"
import { ArrowLeft, Star, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export default function SupplierDetailPage() {
  const { id } = useParams()
  const [supplier, setSupplier] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/suppliers/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/expenses?supplier_id=${id}`).then(r => r.json()).catch(() => []),
      fetch(`/api/purchases?supplier_id=${id}`).then(r => r.json()).catch(() => []),
    ]).then(([s, e, p]) => {
      setSupplier(s)
      if (Array.isArray(e)) setExpenses(e)
      if (Array.isArray(p)) setPurchases(p)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /></div>
  if (!supplier) return <p>Fornecedor não encontrado</p>

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalOrders = purchases.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fornecedores" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">{supplier.category || 'Sem categoria'}</p>
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={20} className={i <= supplier.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Gasto</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pedidos de Compra</p>
          <p className="text-xl font-bold mt-1">{totalOrders}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lançamentos</p>
          <p className="text-xl font-bold mt-1">{expenses.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">CNPJ/CPF</p>
          <p className="text-lg font-medium mt-1">{supplier.cnpj_cpf || '-'}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-3">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-muted-foreground" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-muted-foreground" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-muted-foreground" />
              <span>{supplier.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expenses history */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-3">Histórico de Despesas</h3>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma despesa vinculada a este fornecedor</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-3">Descrição</th>
                <th className="p-3">Obra</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id} className="border-b hover:bg-accent/50">
                  <td className="p-3 font-medium">{e.description}</td>
                  <td className="p-3 text-sm">
                    {e.project ? <Link href={`/projetos/${e.project.id}`} className="text-primary hover:underline">{e.project.name}</Link> : '-'}
                  </td>
                  <td className="p-3">{formatCurrency(Number(e.amount))}</td>
                  <td className="p-3 text-sm">{formatDate(e.date)}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(e.payment_status)}`}>{statusLabel(e.payment_status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
