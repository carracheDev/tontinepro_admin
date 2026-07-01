'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react'
import { COLORS } from '@/lib/colors'

export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
}

/**
 * DataTable réutilisable (Design System) : recherche instantanée + tri par
 * colonne + lignes cliquables. La pagination reste gérée par la page (serveur).
 */
export function DataTable<T>({
  columns, rows, onRowClick, searchText, searchPlaceholder = 'Rechercher…', emptyLabel = 'Aucun résultat',
}: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  searchText?: (row: T) => string
  searchPlaceholder?: string
  emptyLabel?: string
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)

  const filtrees = useMemo(() => {
    let r = rows
    if (q.trim() && searchText) {
      const s = q.toLowerCase()
      r = r.filter((row) => searchText(row).toLowerCase().includes(s))
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sortValue) {
        r = [...r].sort((a, b) => {
          const va = col.sortValue!(a), vb = col.sortValue!(b)
          if (va < vb) return -1 * sort.dir
          if (va > vb) return 1 * sort.dir
          return 0
        })
      }
    }
    return r
  }, [rows, q, sort, columns, searchText])

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  return (
    <div className="rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
      {searchText && (
        <div className="border-b p-3" style={{ borderColor: COLORS.border }}>
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.text.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder}
              className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none focus:shadow-sm"
              style={{ borderColor: COLORS.border }} />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {columns.map((c) => {
                const active = sort?.key === c.key
                return (
                  <th key={c.key} onClick={() => c.sortValue && toggleSort(c.key)}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: COLORS.text.muted, textAlign: c.align ?? 'left', width: c.width, cursor: c.sortValue ? 'pointer' : 'default', userSelect: 'none' }}>
                    <span className="inline-flex items-center gap-1" style={{ justifyContent: c.align === 'right' ? 'flex-end' : undefined }}>
                      {c.header}
                      {c.sortValue && (active ? (sort!.dir === 1 ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />)}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtrees.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-14 text-center">
                <Inbox size={34} className="mx-auto mb-2" style={{ color: COLORS.text.muted, opacity: 0.5 }} />
                <div className="text-sm text-gray-400">{emptyLabel}</div>
              </td></tr>
            ) : (
              filtrees.map((row, i) => (
                <tr key={i} onClick={() => onRowClick?.(row)}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: onRowClick ? 'pointer' : 'default' }}
                  onMouseEnter={(e) => onRowClick && (e.currentTarget.style.background = COLORS.background.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-sm" style={{ textAlign: c.align ?? 'left', color: COLORS.text.primary }}>
                      {c.render ? c.render(row) : (row as any)[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t px-4 py-2 text-xs text-gray-400" style={{ borderColor: COLORS.border }}>
        {filtrees.length} ligne{filtrees.length > 1 ? 's' : ''}{q ? ' (filtrées)' : ''}
      </div>
    </div>
  )
}

export function Badge({ text, color }: { text: string; color: string }) {
  return <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: COLORS.opacity(color, 0.12), color }}>{text}</span>
}

/** Carte KPI épurée (Design System) — remplace les cartes à faux %. */
export function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md" style={{ borderColor: COLORS.border }}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: COLORS.opacity(color, 0.12) }}>
        <Icon size={20} style={{ color }} strokeWidth={1.9} />
      </div>
      <div className="text-3xl font-black leading-none tabular-nums" style={{ color }}>{value}</div>
      <div className="mt-1.5 text-sm font-semibold" style={{ color: COLORS.text.secondary }}>{label}</div>
    </div>
  )
}
