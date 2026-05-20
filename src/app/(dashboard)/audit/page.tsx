'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { ClipboardList, Search, RefreshCw, User, Calendar } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type JournalEntry = {
  id: string
  action: string
  details?: string
  creeLe: string
  utilisateur?: { nom: string; telephone: string; role: string }
  ipAddress?: string
}

const ACTION_COLOR: Record<string, string> = {
  VALIDER_KYC:      '#16A34A', REJETER_KYC:      '#DC2626',
  VALIDER_RETRAIT:  '#16A34A', REJETER_RETRAIT:  '#DC2626',
  VALIDER_CREDIT:   '#16A34A', REFUSER_CREDIT:   '#DC2626',
  SUSPENDRE_COMPTE: '#DC2626', REACTIVER_COMPTE: '#16A34A',
  VALIDER_PADME:    '#1A56DB', SOUMETTRE_PADME:  '#D97706',
  RESOUDRE_LITIGE:  '#16A34A', REJETER_LITIGE:   '#DC2626',
  RESOUDRE_ALERTE:  '#16A34A',
  CONNEXION:        '#6B7280', DECONNEXION:      '#6B7280',
}

function actionColor(action: string) {
  for (const key of Object.keys(ACTION_COLOR)) {
    if (action?.includes(key)) return ACTION_COLOR[key]
  }
  return '#6B7280'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function roleBadge(role: string) {
  const cfg: Record<string, { color: string; bg: string }> = {
    ADMIN:       { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
    SUPERVISEUR: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    AGENT:       { color: '#0284C7', bg: 'rgba(2,132,199,0.1)' },
  }
  const c = cfg[role] ?? { color: '#6B7280', bg: '#F3F4F6' }
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>
      {role}
    </span>
  )
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')

  const params = new URLSearchParams({ page: String(page), limite: '30' })
  if (recherche) params.set('action', recherche)

  const { data, mutate, isLoading } = useSWR(`/audit?${params}`, fetcher, { refreshInterval: 60_000 })

  const entrees: JournalEntry[] = Array.isArray(data) ? data : data?.entrees ?? []
  const total: number = data?.total ?? entrees.length
  const pages = Math.ceil(total / 30)

  return (
    <div className="space-y-5 max-w-350">
      {/* Barre de contrôle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1) }}
            placeholder="Filtrer par action (ex: KYC, RETRAIT...)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#fff', border: '1px solid var(--border)' }} />
        </div>
        <button onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <RefreshCw size={14} /> Actualiser
        </button>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{total} entrée(s)</span>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            Journal d&apos;audit — page {page}/{pages || 1}
          </h2>
          <span className="ml-auto text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse inline-block" />
            refresh 60s
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <RefreshCw size={18} className="animate-spin" /> Chargement…
          </div>
        ) : entrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <ClipboardList size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Aucune entrée d&apos;audit trouvée</p>
          </div>
        ) : (
          <div className="relative">
            {/* Ligne timeline */}
            <div className="absolute left-11 top-0 bottom-0 w-px" style={{ background: '#F3F4F6' }} />
            {entrees.map((e, i) => {
              const color = actionColor(e.action)
              return (
                <div key={e.id} className="flex items-start gap-4 px-5 py-4 relative"
                  style={{ borderBottom: i < entrees.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  {/* Point timeline */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10"
                    style={{ background: `${color}18`, border: `2px solid ${color}` }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  </div>
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="font-bold text-sm font-mono" style={{ color }}>
                        {e.action}
                      </span>
                    </div>
                    {e.details && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{e.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {e.utilisateur && (
                        <div className="flex items-center gap-1">
                          <User size={11} style={{ color: 'var(--muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{e.utilisateur.nom}</span>
                          {roleBadge(e.utilisateur.role)}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={11} style={{ color: 'var(--muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{fmtDate(e.creeLe)}</span>
                      </div>
                      {e.ipAddress && (
                        <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{e.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
              style={{ background: '#F3F4F6', color: 'var(--muted)' }}>← Précédent</button>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Page {page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
              style={{ background: '#F3F4F6', color: 'var(--muted)' }}>Suivant →</button>
          </div>
        )}
      </div>
    </div>
  )
}
