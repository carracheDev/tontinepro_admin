'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import { DataTable, Badge, type Column } from '@/components/ui/data-table'
import {
  Receipt, RefreshCw, Coins, ArrowUpFromLine, ArrowDownToLine, CreditCard,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then((r) => r.data?.donnees ?? r.data)
const fmtFcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' F'
const fmtDate = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

type Transaction = {
  id: string; type: string; statut: string; montantFcfa: number
  operateur?: string; reference?: string; creeLe: string
  utilisateur?: { nom: string; telephone: string }
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; couleur: string }> = {
  COTISATION: { label: 'Cotisation', icon: Coins, couleur: COLORS.primary },
  RETRAIT: { label: 'Retrait', icon: ArrowUpFromLine, couleur: COLORS.danger },
  DISTRIBUTION_GROUPE: { label: 'Distribution', icon: ArrowDownToLine, couleur: COLORS.danger },
  REMBOURSEMENT: { label: 'Remboursement', icon: RefreshCw, couleur: COLORS.info },
  MICRO_CREDIT: { label: 'Micro-crédit', icon: CreditCard, couleur: COLORS.warning },
}
const statutColor = (s: string) => (s === 'SUCCES' ? COLORS.success : ['ECHOUE', 'ECHOUEE'].includes(s) ? COLORS.danger : s === 'EN_ATTENTE' ? COLORS.warning : COLORS.text.muted)
const debitType = (t: string) => t === 'RETRAIT' || t === 'DISTRIBUTION_GROUPE'

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [statut, setStatut] = useState('')

  const params = new URLSearchParams({ page: String(page), limite: '20' })
  if (type) params.set('type', type)
  if (statut) params.set('statut', statut)
  const { data, isLoading, mutate } = useSWR(`/transactions/historique?${params}`, fetcher, { refreshInterval: 30_000 })

  const rows: Transaction[] = data?.transactions ?? []
  const total: number = data?.total ?? 0
  const totalPages: number = data?.pages ?? 1

  const columns: Column<Transaction>[] = [
    {
      key: 'type', header: 'Type', sortValue: (t) => t.type,
      render: (t) => {
        const c = TYPE_CONFIG[t.type] ?? { label: t.type, icon: Receipt, couleur: COLORS.text.muted }
        const Ic = c.icon
        return <span className="inline-flex items-center gap-2 font-semibold"><Ic size={15} style={{ color: c.couleur }} /> {c.label}</span>
      },
    },
    {
      key: 'client', header: 'Client', sortValue: (t) => t.utilisateur?.nom ?? '',
      render: (t) => (
        <div>
          <div className="font-medium">{t.utilisateur?.nom ?? '—'}</div>
          <div className="text-xs text-gray-400">{t.utilisateur?.telephone ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'montant', header: 'Montant', align: 'right', sortValue: (t) => t.montantFcfa,
      render: (t) => <span className="font-black tabular-nums" style={{ color: debitType(t.type) ? COLORS.danger : COLORS.primary }}>{debitType(t.type) ? '−' : '+'}{fmtFcfa(t.montantFcfa)}</span>,
    },
    { key: 'statut', header: 'Statut', sortValue: (t) => t.statut, render: (t) => <Badge text={t.statut} color={statutColor(t.statut)} /> },
    { key: 'canal', header: 'Canal', render: (t) => <span className="text-gray-500">{t.operateur ?? (t.reference ? t.reference.slice(0, 12) : '—')}</span> },
    { key: 'date', header: 'Date', align: 'right', sortValue: (t) => new Date(t.creeLe).getTime(), render: (t) => <span className="text-gray-500">{fmtDate(t.creeLe)}</span> },
  ]

  const setFiltre = (fn: () => void) => { fn(); setPage(1) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: COLORS.text.primary }}>
            <Receipt size={22} style={{ color: COLORS.primary }} /> Transactions
          </h1>
          <p className="text-sm text-gray-500">{total} au total · mise à jour auto (30 s)</p>
        </div>
        <button onClick={() => mutate()} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-600" style={{ borderColor: COLORS.border }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setFiltre(() => setType(e.target.value))} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: COLORS.border }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={statut} onChange={(e) => setFiltre(() => setStatut(e.target.value))} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: COLORS.border }}>
          <option value="">Tous les statuts</option>
          <option value="SUCCES">Succès</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="ECHOUE">Échouée</option>
        </select>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="py-16 text-center text-gray-400">Chargement…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          searchText={(t) => `${t.utilisateur?.nom ?? ''} ${t.utilisateur?.telephone ?? ''} ${t.reference ?? ''} ${t.type}`}
          searchPlaceholder="Rechercher (client, téléphone, référence)…"
          emptyLabel="Aucune transaction"
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: COLORS.border }}><ChevronLeft size={15} /> Précédent</button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: COLORS.border }}>Suivant <ChevronRight size={15} /></button>
        </div>
      )}
    </div>
  )
}
