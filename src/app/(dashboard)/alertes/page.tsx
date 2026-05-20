'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
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
  RESOLUE:  { color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
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

      {/* Alerte critique globale */}
      {critiques > 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3 animate-pulse"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)' }}>
          <AlertTriangle size={20} style={{ color: '#DC2626' }} className="shrink-0" />
          <p className="font-bold text-sm" style={{ color: '#DC2626' }}>
            🚨 {critiques} alerte{critiques > 1 ? 's' : ''} CRITIQUE{critiques > 1 ? 'S' : ''} non résolue{critiques > 1 ? 's' : ''} — action immédiate requise
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titre="Critiques actives" valeur={critiques} icone={AlertTriangle}
          couleur="#DC2626" badge={critiques > 0 ? '!' : undefined} badgeCouleur="#DC2626" />
        <KpiCard titre="Ouvertes" valeur={ouvertes} icone={Clock} couleur="var(--danger)" />
        <KpiCard titre="En cours" valeur={enCours} icone={Zap} couleur="var(--warning)" />
        <KpiCard titre="Résolues" valeur={resolues} icone={CheckCircle2} couleur="var(--primary)" />
      </div>

      {/* Table alertes */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-sm flex-1" style={{ color: 'var(--foreground)' }}>
            Timeline alertes — {filtrees.length}
          </h2>
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
            refresh 20s
          </span>
          {/* Filtres statut */}
          <div className="flex gap-1.5">
            {[{ v: '', l: 'Tous' }, { v: 'OUVERTE', l: 'Ouvertes' }, { v: 'EN_COURS', l: 'En cours' }, { v: 'RESOLUE', l: 'Résolues' }].map(({ v, l }) => (
              <button key={v} onClick={() => setFiltreStatut(v)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: filtreStatut === v ? 'var(--primary)' : '#F3F4F6', color: filtreStatut === v ? '#fff' : 'var(--muted)' }}>
                {l}
              </button>
            ))}
          </div>
          {/* Filtres sévérité */}
          <div className="flex gap-1.5">
            {[{ v: '', l: 'Tout' }, { v: 'CRITIQUE', l: '🚨' }, { v: 'HAUTE', l: '⚠️' }, { v: 'MOYENNE', l: '🔵' }].map(({ v, l }) => (
              <button key={v} onClick={() => setFiltreSev(v)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: filtreSev === v ? '#1F2937' : '#F3F4F6', color: filtreSev === v ? '#fff' : 'var(--muted)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {filtrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <CheckCircle2 size={36} className="mb-2 opacity-30" />
            <p className="font-semibold text-sm">Aucune alerte correspondante</p>
          </div>
        ) : (
          <div>
            {filtrees.map((a, i) => {
              const sev = SEV_CONFIG[a.severite] ?? SEV_CONFIG.BASSE
              const st  = STATUT_CONFIG[a.statut]  ?? STATUT_CONFIG.OUVERTE
              return (
                <div key={a.id} className="px-5 py-4 flex items-start gap-4"
                  style={{ borderBottom: i < filtrees.length - 1 ? '1px solid #F3F4F6' : 'none', background: a.severite === 'CRITIQUE' && a.statut !== 'RESOLUE' ? 'rgba(220,38,38,0.02)' : 'transparent' }}>
                  {/* Icône */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: sev.bg, color: sev.color }}>
                    <TypeIcon type={a.type} />
                  </div>
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{a.titre}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: sev.color, background: sev.bg }}>
                        {sev.label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                        {a.statut}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{a.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                      {fmtDate(a.creeLe)}
                      {a.resourceType && ` · ${a.resourceType}`}
                      {a.resoluLe && ` · Résolu le ${fmtDate(a.resoluLe)}`}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {a.statut !== 'RESOLUE' && (
                      <button onClick={() => resoudre(a.id)} disabled={loadingId === a.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                        style={{ background: 'var(--primary)' }}>
                        <CheckCircle2 size={13} /> Résoudre
                      </button>
                    )}
                    {a.statut === 'RESOLUE' && (
                      <button onClick={() => rouvrir(a.id)} disabled={loadingId === a.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
                        style={{ background: '#F3F4F6', color: 'var(--muted)' }}>
                        <RotateCcw size={13} /> Rouvrir
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
