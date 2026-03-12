'use client'

interface PaginationProps {
  page: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalCount, perPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / perPage)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <span className="text-sm text-muted-foreground">
        {totalCount} registros • Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}
