'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import {
  FileText, CheckCircle2, Send, XCircle, Clock,
  ChevronRight, BarChart2, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell,
} from 'recharts'
import KpiCard from '@/components/dashboard/kpi-card'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type DossierPADME = {
  id: string
  statut: 'GENERE' | 'VALIDE_ADMIN' | 'SOUMIS_PADME' | 'ACCEPTE' | 'REJETE'
  scoreAuMoment: number
  creeLe: string
  misAJourLe: string
  client?: { nom: string; telephone: string }
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  GENERE:       { label: 'Généré',          color: '#6B7280', bg: '#F3F4F6',                   icon: FileText },
  VALIDE_ADMIN: { label: 'Validé admin',    color: '#1A56DB', bg: 'rgba(26,86,219,0.1)',        icon: CheckCircle2 },
  SOUMIS_PADME: { label: 'Soumis PADME',   color: '#D97706', bg: 'rgba(217,119,6,0.1)',         icon: Send },
  ACCEPTE:      { label: 'Accepté ✓',      color: '#16A34A', bg: 'rgba(22,163,74,0.1)',         icon: CheckCircle2 },
  REJETE:       { label: 'Rejeté',          color: '#DC2626', bg: 'rgba(220,38,38,0.1)',         icon: XCircle },
}

const FUNNEL_STEPS = [
  { key: 'GENERE',       label: 'Générés',       color: '#9CA3AF' },
  { key: 'VALIDE_ADMIN', label: 'Validés admin', color: '#1A56DB' },
  { key: 'SOUMIS_PADME', label: 'Soumis PADME',  color: '#D97706' },
  { key: 'ACCEPTE',      label: 'Acceptés',      color: '#16A34A' },
  { key: 'REJETE',       label: 'Rejetés',       color: '#DC2626' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color, background: bg }}>{label}</span>
  )
}

export default function PadmePage() {
  const { data, mutate } = useSWR('/padme/tous?limite=50', fetcher, { refreshInterval: 120_000 })
  const { data: zonesData } = useSWR('/analytics/scores-par-zone', fetcher, { refreshInterval: 120_000 })

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const dossiers: DossierPADME[] = Array.isArray(data) ? data : data?.dossiers ?? []

  const counts = FUNNEL_STEPS.reduce((acc, s) => {
    acc[s.key] = dossiers.filter(d => d.statut === s.key).length
    return acc
  }, {} as Record<string, number>)

  const filtres = filtreStatut ? dossiers.filter(d => d.statut === filtreStatut) : dossiers

  const zonesListe: { zone: string; scoreMoyen: number; eligiblesPADME: number; nbClients: number }[] =
    Array.isArray(zonesData) ? zonesData : []

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  async function validerAdmin(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/padme/${id}/valider`)
      showToast('ok', '✅ Dossier validé par l\'admin')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  async function soumettrePADME(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/padme/${id}/soumettre`)
      showToast('ok', '📤 Dossier soumis à PADME')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  async function exporterPdf(id: string) {
    try {
      const res = await api.get(`/padme/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `dossier-padme-${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { showToast('err', extraireErreur(err)) }
  }

  const maxZone = zonesListe.length > 0 ? Math.max(...zonesListe.map(z => z.eligiblesPADME)) : 1

  return (
    <div className="space-y-6 max-w-350">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {toast.text}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {FUNNEL_STEPS.map(s => (
          <KpiCard key={s.key} titre={s.label} valeur={counts[s.key]} icone={FileText} couleur={s.color} />
        ))}
      </div>

      {/* Funnel visuel + BarChart zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Funnel */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--muted)' }}>
            Pipeline PADME
          </h3>
          <div className="space-y-2">
            {FUNNEL_STEPS.map((step, i) => {
              const pct = counts[FUNNEL_STEPS[0].key] > 0
                ? Math.round(counts[step.key] / counts[FUNNEL_STEPS[0].key] * 100)
                : 0
              return (
                <div key={step.key}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold w-28 shrink-0" style={{ color: 'var(--muted)' }}>{step.label}</span>
                    <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <div className="h-full rounded-lg flex items-center px-2.5 transition-all"
                        style={{ width: `${Math.max(pct, 4)}%`, background: step.color }}>
                        <span className="text-xs font-bold text-white">{counts[step.key]}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold w-8 text-right shrink-0" style={{ color: step.color }}>{pct}%</span>
                  </div>
                  {i < FUNNEL_STEPS.length - 1 && (
                    <div className="flex justify-start ml-28 pl-3">
                      <ChevronRight size={12} style={{ color: '#D1D5DB' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Éligibles par zone */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Éligibles PADME par zone
          </h3>
          {zonesListe.length === 0 ? (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--muted)' }}>
              <BarChart2 size={32} className="opacity-30" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={zonesListe} barSize={18} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v, n) => [v, n === 'eligiblesPADME' ? 'Éligibles PADME' : 'Score moyen']} />
                <Bar dataKey="eligiblesPADME" name="Éligibles PADME" radius={[4, 4, 0, 0]}>
                  {zonesListe.map((z, i) => (
                    <Cell key={i} fill={z.eligiblesPADME === maxZone ? '#16A34A' : '#BBF7D0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table dossiers */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-sm flex-1" style={{ color: 'var(--foreground)' }}>
            Dossiers — {filtres.length} résultat(s)
          </h2>
          <div className="flex gap-2 flex-wrap">
            {[{ v: '', l: 'Tous' }, ...FUNNEL_STEPS.map(s => ({ v: s.key, l: s.label }))].map(({ v, l }) => (
              <button key={v} onClick={() => setFiltreStatut(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: filtreStatut === v ? 'var(--primary)' : '#F3F4F6',
                  color: filtreStatut === v ? '#fff' : 'var(--muted)',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Score', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.map(d => {
                const cfg = STATUT_CONFIG[d.statut] ?? STATUT_CONFIG.GENERE
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {d.client?.nom ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.client?.telephone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-black text-sm" style={{
                        color: d.scoreAuMoment >= 80 ? '#16A34A' : d.scoreAuMoment >= 70 ? '#1A56DB' : '#D97706'
                      }}>
                        {d.scoreAuMoment}/100
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill label={cfg.label} color={cfg.color} bg={cfg.bg} />
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted)' }}>{fmtDate(d.creeLe)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {d.statut === 'GENERE' && (
                          <button onClick={() => validerAdmin(d.id)} disabled={loadingId === d.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                            style={{ background: '#1A56DB' }}>
                            <CheckCircle2 size={13} /> Valider
                          </button>
                        )}
                        {d.statut === 'VALIDE_ADMIN' && (
                          <button onClick={() => soumettrePADME(d.id)} disabled={loadingId === d.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                            style={{ background: 'var(--warning)' }}>
                            <Send size={13} /> Soumettre
                          </button>
                        )}
                        <button onClick={() => exporterPdf(d.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: '#F3F4F6', color: 'var(--muted)' }}>
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
