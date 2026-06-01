'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import {
  ArrowDownToLine, ArrowUpFromLine, Coins, CreditCard,
  RefreshCw, Search, Filter, CheckCircle2, XCircle, Clock,
  Receipt,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

// ─── Types ────────────────────────────────────────────────────────────────────
type Transaction = {
  id: string
  type: string
  statut: string
  montantFcfa: number
  montantNetFcfa?: number
  fraisPlateformeFcfa?: number
  operateur?: string
  reference?: string
  creeLe: string
  utilisateur?: { nom: string; telephone: string }
  tontine?: { nom: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Coins; couleur: string }> = {
  COTISATION:          { label: 'Cotisation',       icon: Coins,            couleur: '#16A34A' },
  RETRAIT:             { label: 'Retrait',           icon: ArrowUpFromLine,  couleur: '#F59E0B' },
  DISTRIBUTION_GROUPE: { label: 'Distribution',     icon: ArrowDownToLine,  couleur: '#3B82F6' },
  REMBOURSEMENT:       { label: 'Remboursement',     icon: RefreshCw,        couleur: '#8B5CF6' },
  MICRO_CREDIT:        { label: 'Micro-crédit',      icon: CreditCard,       couleur: '#EC4899' },
}

const STATUT_CONFIG: Record<string, { label: string; couleur: string; bg: string; icon: typeof CheckCircle2 }> = {
  SUCCES:     { label: 'Succès',      couleur: '#16A34A', bg: 'rgba(22,163,74,0.1)',  icon: CheckCircle2 },
  ECHOUEE:    { label: 'Échouée',     couleur: '#EF4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircle },
  EN_ATTENTE: { label: 'En attente',  couleur: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  ANNULEE:    { label: 'Annulée',     couleur: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: XCircle },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [statut, setStatut] = useState('')
  const [recherche, setRecherche] = useState('')
  const [rechercheInput, setRechercheInput] = useState('')

  const params = new URLSearchParams({ page: String(page), limite: '20' })
  if (type)   params.set('type', type)
  if (statut) params.set('statut', statut)

  const { data, isLoading, mutate } = useSWR(`/transactions/historique?${params}`, fetcher, { refreshInterval: 30_000 })

  const transactions: Transaction[] = data?.transactions ?? []
  const total: number = data?.total ?? 0
  const totalPages: number = data?.pages ?? 1

  const txFiltrees = recherche
    ? transactions.filter(tx =>
        tx.utilisateur?.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        tx.utilisateur?.telephone.includes(recherche) ||
        tx.reference?.toLowerCase().includes(recherche.toLowerCase())
      )
    : transactions

  function appliquerRecherche() {
    setRecherche(rechercheInput)
    setPage(1)
  }

  function reinitialiser() {
    setType('')
    setStatut('')
    setRecherche('')
    setRechercheInput('')
    setPage(1)
  }

  return (
    <div className="space-y-6">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0F172A' }}>Transactions</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            {total > 0 ? `${total} transaction(s) au total` : 'Historique complet des transactions'}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* ── Filtres ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} style={{ color: '#64748B' }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>Filtres</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Recherche */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <Search size={14} style={{ color: '#94A3B8' }} />
            <input
              value={rechercheInput}
              onChange={e => setRechercheInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && appliquerRecherche()}
              placeholder="Nom client, téléphone, référence..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: '#0F172A' }}
            />
          </div>

          {/* Type */}
          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
          >
            <option value="">Tous les types</option>
            <option value="COTISATION">Cotisation</option>
            <option value="RETRAIT">Retrait</option>
            <option value="DISTRIBUTION_GROUPE">Distribution groupe</option>
            <option value="REMBOURSEMENT">Remboursement</option>
            <option value="MICRO_CREDIT">Micro-crédit</option>
          </select>

          {/* Statut */}
          <select
            value={statut}
            onChange={e => { setStatut(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
          >
            <option value="">Tous les statuts</option>
            <option value="SUCCES">Succès</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="ECHOUEE">Échouée</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          {(type || statut || recherche) && (
            <button onClick={reinitialiser}
              className="px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Tableau ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.07)' }}>
        {/* Header tableau */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div className="flex items-center gap-2">
            <Receipt size={16} style={{ color: '#16A34A' }} />
            <span className="font-bold text-sm" style={{ color: '#0F172A' }}>
              {txFiltrees.length > 0 ? `${txFiltrees.length} transaction(s)` : 'Transactions'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="w-9 h-9 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-6 bg-slate-100 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : txFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Receipt size={40} style={{ color: '#CBD5E1' }} />
            <p className="font-semibold" style={{ color: '#94A3B8' }}>Aucune transaction</p>
            <p className="text-sm" style={{ color: '#CBD5E1' }}>
              {type || statut ? 'Modifiez les filtres pour voir plus de résultats' : 'Les transactions apparaîtront ici en temps réel'}
            </p>
          </div>
        ) : (
          <div>
            {txFiltrees.map((tx) => {
              const typeConf = TYPE_CONFIG[tx.type] ?? { label: tx.type, icon: Receipt, couleur: '#64748B' }
              const statutConf = STATUT_CONFIG[tx.statut] ?? { label: tx.statut, couleur: '#64748B', bg: '#F1F5F9', icon: Clock }
              const TypeIcon = typeConf.icon
              const StatutIcon = statutConf.icon

              return (
                <div
                  key={tx.id}
                  className="px-6 py-4 flex items-center gap-4 transition-colors hover:bg-slate-50"
                  style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                  {/* Icône type */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${typeConf.couleur}15`, border: `1px solid ${typeConf.couleur}30` }}>
                    <TypeIcon size={18} style={{ color: typeConf.couleur }} />
                  </div>

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: '#0F172A' }}>
                        {tx.utilisateur?.nom ?? 'Utilisateur inconnu'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${typeConf.couleur}12`, color: typeConf.couleur }}>
                        {typeConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: '#94A3B8' }}>
                        {tx.utilisateur?.telephone}
                      </span>
                      {tx.tontine && (
                        <span className="text-xs" style={{ color: '#94A3B8' }}>
                          • {tx.tontine.nom}
                        </span>
                      )}
                      {tx.operateur && (
                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                          • {tx.operateur}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#CBD5E1' }}>
                        {fmtDate(tx.creeLe)}
                      </span>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-black" style={{ color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(tx.montantFcfa)} FCFA
                    </p>
                    {tx.fraisPlateformeFcfa != null && tx.fraisPlateformeFcfa > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                        frais : {fmt(tx.fraisPlateformeFcfa)} FCFA
                      </p>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: statutConf.bg, color: statutConf.couleur }}>
                      <StatutIcon size={12} />
                      {statutConf.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #E2E8F0' }}>
            <span className="text-sm" style={{ color: '#64748B' }}>
              Page {page} / {totalPages} — {total} résultats
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
                style={{ background: '#F1F5F9', color: '#0F172A' }}
              >
                ← Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
                style={{ background: '#16A34A', color: '#fff' }}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
