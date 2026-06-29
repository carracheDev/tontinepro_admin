'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { COLORS, SEVERITY_COLORS } from '@/lib/colors'
import { AlertTriangle, CheckCircle2, RotateCcw, Clock, ShieldAlert, Zap, TrendingDown } from 'lucide-react'
import KpiCard from '@/components/dashboard/kpi-card'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Alerte = {
  id: string
  type: string
  severite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'BASSE'
  statut: 'OUVERTE' | 'EN_COURS' | 'RESOLUE'
  titre: string
  message: string
  resourceType?: string
  resourceId?: string
  creeLe: string
  resoluLe?: string
}

const SEV_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITIQUE: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  label: '🚨 CRITIQUE' },
  HAUTE:    { color: '#D97706', bg: 'rgba(217,119,6,0.1)',  label: '⚠️ HAUTE' },
  MOYENNE:  { color: '#0284C7', bg: 'rgba(2,132,199,0.1)',  label: '🔵 MOYENNE' },
  BASSE:    { color: '#6B7280', bg: '#F3F4F6',              label: '⚪ BASSE' },
}

const STATUT_CONFIG: Record<string, { color: string; bg: string }> = {
  OUVERTE:  { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  EN_COURS: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  RESOLUE:  { color: '#2563EB', bg: 'rgba(22,163,74,0.1)' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function TypeIcon({ type }: { type: string }) {
  if (type?.includes('CIRCUIT') || type?.includes('KKIAPAY')) return <Zap size={16} />
  if (type?.includes('PIN') || type?.includes('FRAUDE'))       return <ShieldAlert size={16} />
  if (type?.includes('RETRAIT') || type?.includes('CREDIT'))   return <TrendingDown size={16} />
  return <AlertTriangle size={16} />
}

export default function AlertesPage() {
  const { data, mutate } = useSWR('/alertes', fetcher, { refreshInterval: 20_000 })
  const { data: stats } = useSWR('/alertes/statistiques', fetcher, { refreshInterval: 60_000 })

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreSev, setFiltreSev] = useState('')
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const alertes: Alerte[] = Array.isArray(data) ? data : data?.alertes ?? []

  const critiques  = alertes.filter(a => a.severite === 'CRITIQUE' && a.statut !== 'RESOLUE').length
  const ouvertes   = alertes.filter(a => a.statut === 'OUVERTE').length
  const enCours    = alertes.filter(a => a.statut === 'EN_COURS').length
  const resolues   = alertes.filter(a => a.statut === 'RESOLUE').length

  const filtrees = alertes.filter(a => {
    if (filtreStatut && a.statut !== filtreStatut) return false
    if (filtreSev && a.severite !== filtreSev) return false
    return true
  })

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text }); setTimeout(() => setToast(null), 4000)
  }

  async function resoudre(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/alertes/${id}/resoudre`)
      showToast('ok', '✅ Alerte résolue')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  async function rouvrir(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/alertes/${id}/rouvrir`)
      showToast('ok', 'Alerte rouverte')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-6 max-w-350">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {toast.text}
        </div>
      )}

      {/* Alerte critique globale (MODERNE) */}
      {critiques > 0 && (
        <div
          className="rounded-3xl px-6 py-5 flex items-center gap-4 animate-pulse transition-all"
          style={{
            background: 'rgba(220, 38, 38, 0.12)',
            border: '2px solid #DC2626',
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.15)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(220, 38, 38, 0.2)' }}
          >
            <AlertTriangle size={24} style={{ color: '#DC2626' }} />
          </div>
          <div className="flex-1">
            <p className="font-black text-base" style={{ color: '#DC2626' }}>
              🚨 {critiques} alerte{critiques > 1 ? 's' : ''} CRITIQUE{critiques > 1 ? 'S' : ''} !
            </p>
            <p className="text-sm mt-1" style={{ color: '#B91C1C' }}>
              Action immédiate requise
            </p>
          </div>
        </div>
      )}

      {/* KPIs — Design moderne avec tendances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { titre: 'Critiques actives', valeur: critiques, icone: AlertTriangle, couleur: '#DC2626', trend: -15 },
          { titre: 'Ouvertes', valeur: ouvertes, icone: Clock, couleur: '#D97706', trend: 8 },
          { titre: 'En cours', valeur: enCours, icone: Zap, couleur: '#0284C7', trend: 3 },
          { titre: 'Résolues', valeur: resolues, icone: CheckCircle2, couleur: '#2563EB', trend: 12 },
        ].map(({ titre, valeur, icone: Icon, couleur, trend }) => (
          <div
            key={titre}
            className="rounded-2xl p-6 transition-all"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${couleur}15`,
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${couleur}18`
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}35`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)'
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}15`
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${couleur}12` }}>
                <Icon size={22} style={{ color: couleur }} strokeWidth={1.8} />
              </div>
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: trend > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: trend > 0 ? '#10B981' : '#EF4444',
                }}
              >
                {trend > 0 ? '↓' : '↑'} {Math.abs(trend)}%
              </div>
            </div>
            <p className="text-4xl font-black leading-none mb-2" style={{ color: couleur, fontVariantNumeric: 'tabular-nums' }}>
              {valeur}
            </p>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
              {titre}
            </p>
          </div>
        ))}
      </div>

      {/* Alertes (MODERN CARDS) */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-black text-2xl" style={{ color: '#0F172A' }}>
              Timeline alertes
            </h2>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>
              {filtrees.length} alerte{filtrees.length !== 1 ? 's' : ''} • refresh auto 20s
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl" style={{ color: '#2563EB', background: '#EFF4FF', border: '1px solid #BBFE7D' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Filtres — Design moderne spacieux */}
        <div className="space-y-4">
          {/* Filtre Statut */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
              Statut
            </p>
            <div className="flex gap-3 flex-wrap">
              {[{ v: '', l: 'Tous' }, { v: 'OUVERTE', l: 'Ouvertes' }, { v: 'EN_COURS', l: 'En cours' }, { v: 'RESOLUE', l: 'Résolues' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setFiltreStatut(v)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: filtreStatut === v ? '#2563EB' : '#F3F4F6',
                    color: filtreStatut === v ? '#fff' : '#6B7280',
                    border: filtreStatut === v ? `2px solid #2563EB` : '1px solid #E5E7EB',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre Sévérité */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
              Sévérité
            </p>
            <div className="flex gap-3 flex-wrap">
              {[{ v: '', l: 'Tout' }, { v: 'CRITIQUE', l: '🚨 Critique' }, { v: 'HAUTE', l: '⚠️ Haute' }, { v: 'MOYENNE', l: '🔵 Moyenne' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setFiltreSev(v)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: filtreSev === v ? '#1F2937' : '#F3F4F6',
                    color: filtreSev === v ? '#fff' : '#6B7280',
                    border: filtreSev === v ? '2px solid #1F2937' : '1px solid #E5E7EB',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtrees.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#EFF4FF' }}>
              <CheckCircle2 size={32} style={{ color: '#2563EB', opacity: 0.5 }} />
            </div>
            <p className="font-bold text-base" style={{ color: '#0F172A' }}>Aucune alerte correspondante</p>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>Les alertes filtrées apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filtrees.map((a) => {
              const sev = SEV_CONFIG[a.severite] ?? SEV_CONFIG.BASSE
              const st  = STATUT_CONFIG[a.statut]  ?? STATUT_CONFIG.OUVERTE
              const isCritique = a.severite === 'CRITIQUE' && a.statut !== 'RESOLUE'

              return (
                <div
                  key={a.id}
                  className="rounded-3xl p-6 flex items-start gap-5 transition-all group"
                  style={{
                    background: isCritique ? `${sev.color}08` : '#FFFFFF',
                    border: `2px solid ${sev.color}35`,
                    boxShadow: isCritique
                      ? `0 8px 32px ${sev.color}25, 0 0 0 8px ${sev.color}08`
                      : '0 2px 12px rgba(15,23,42,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isCritique
                      ? `0 16px 48px ${sev.color}30, 0 0 0 8px ${sev.color}08`
                      : '0 12px 32px rgba(15,23,42,0.12)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = `${sev.color}50`
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isCritique
                      ? `0 8px 32px ${sev.color}25, 0 0 0 8px ${sev.color}08`
                      : '0 2px 12px rgba(15,23,42,0.08)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = `${sev.color}35`
                  }}
                >
                  {/* Icône GRANDE et Color-coded */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 flex-none"
                    style={{ background: sev.bg, color: sev.color }}
                  >
                    <div style={{ fontSize: '28px' }}>
                      <TypeIcon type={a.type} />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    {/* Titre + Badges */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-black text-base leading-tight" style={{ color: '#0F172A' }}>
                          {a.titre}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        <span
                          className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{ color: sev.color, background: sev.bg, border: `1px solid ${sev.color}50` }}
                        >
                          {sev.label}
                        </span>
                        <span
                          className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}50` }}
                        >
                          {a.statut}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                      {a.message}
                    </p>

                    {/* Métadonnées */}
                    <p className="text-xs mt-3" style={{ color: '#9CA3B8' }}>
                      {fmtDate(a.creeLe)}
                      {a.resourceType && ` · ${a.resourceType}`}
                      {a.resoluLe && ` · Résolu le ${fmtDate(a.resoluLe)}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex-none">
                    {a.statut !== 'RESOLUE' ? (
                      <button
                        onClick={() => resoudre(a.id)}
                        disabled={loadingId === a.id}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 hover:shadow-lg"
                        style={{
                          background: '#2563EB',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Résoudre</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => rouvrir(a.id)}
                        disabled={loadingId === a.id}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:shadow-lg"
                        style={{
                          background: '#F3F4F6',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <RotateCcw size={16} />
                        <span>Rouvrir</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
