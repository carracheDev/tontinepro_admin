'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import {
  FileText, CheckCircle2, Send, XCircle, Clock,
  ChevronRight, BarChart2, Download, Eye, X, ShieldCheck, ShieldAlert,
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
  descriptionActivite?: string
  montantSouhaite?: number
  objetCredit?: string
  client?: { nom: string; telephone: string }
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  GENERE:       { label: 'Généré',          color: '#6B7280', bg: '#F3F4F6',                   icon: FileText },
  VALIDE_ADMIN: { label: 'Validé admin',    color: '#1A56DB', bg: 'rgba(26,86,219,0.1)',        icon: CheckCircle2 },
  SOUMIS_PADME: { label: 'Soumis PADME',   color: '#D97706', bg: 'rgba(217,119,6,0.1)',         icon: Send },
  ACCEPTE:      { label: 'Accepté ✓',      color: '#2563EB', bg: 'rgba(22,163,74,0.1)',         icon: CheckCircle2 },
  REJETE:       { label: 'Rejeté',          color: '#DC2626', bg: 'rgba(220,38,38,0.1)',         icon: XCircle },
}

const FUNNEL_STEPS = [
  { key: 'GENERE',       label: 'Générés',       color: '#9CA3AF' },
  { key: 'VALIDE_ADMIN', label: 'Validés admin', color: '#1A56DB' },
  { key: 'SOUMIS_PADME', label: 'Soumis PADME',  color: '#D97706' },
  { key: 'ACCEPTE',      label: 'Acceptés',      color: '#2563EB' },
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
  // Dossier ouvert dans le panneau de détail (null = fermé)
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: detail, isLoading: detailLoading } = useSWR(
    detailId ? `/padme/${detailId}` : null, fetcher,
  )
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

  async function enregistrerResultat(id: string, statut: 'ACCEPTE' | 'REJETE', commentaire?: string) {
    setLoadingId(id)
    try {
      await api.put(`/padme/${id}/resultat`, { statut, commentaire: commentaire ?? '' })
      showToast('ok', statut === 'ACCEPTE' ? '✅ Dossier accepté par PADME' : '❌ Dossier rejeté')
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
                    <Cell key={i} fill={z.eligiblesPADME === maxZone ? '#2563EB' : '#BFDBFE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Dossiers */}
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

        <div className="divide-y" style={{ borderColor: '#E2E8F0' }}>
          {filtres.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--muted)' }}>
              <FileText size={40} className="opacity-20" />
              <p className="text-sm">Aucun dossier dans cette catégorie</p>
            </div>
          )}
          {filtres.map(d => {
            const cfg = STATUT_CONFIG[d.statut] ?? STATUT_CONFIG.GENERE
            return (
              <div key={d.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">

                  {/* Avatar initiales */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white"
                    style={{ background: 'var(--primary-dark)' }}>
                    {(d.client?.nom ?? 'C').charAt(0).toUpperCase()}
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">

                    {/* Ligne 1 : Identité + statut + date */}
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                        {d.client?.nom ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.client?.telephone}</p>
                      <Pill label={cfg.label} color={cfg.color} bg={cfg.bg} />
                      <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>{fmtDate(d.creeLe)}</span>
                    </div>

                    {/* Ligne 2 : Détails de la demande */}
                    <div className="flex items-center gap-4 flex-wrap mb-3">
                      {/* Score */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: '#F8FAFC' }}>
                        <BarChart2 size={13} style={{ color: 'var(--muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Score</span>
                        <span className="text-xs font-black" style={{
                          color: d.scoreAuMoment >= 80 ? '#2563EB' : d.scoreAuMoment >= 70 ? '#1A56DB' : '#D97706'
                        }}>
                          {d.scoreAuMoment}/100
                        </span>
                      </div>

                      {/* Montant souhaité */}
                      {d.montantSouhaite != null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(22,163,74,0.07)' }}>
                          <span className="text-xs font-bold" style={{ color: '#2563EB' }}>
                            {d.montantSouhaite.toLocaleString('fr-FR')} FCFA demandés
                          </span>
                        </div>
                      )}

                      {/* Objet du crédit */}
                      {d.objetCredit && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(26,86,219,0.07)' }}>
                          <span className="text-xs font-semibold" style={{ color: '#1A56DB' }}>{d.objetCredit}</span>
                        </div>
                      )}
                    </div>

                    {/* Description activité */}
                    {d.descriptionActivite && (
                      <p className="text-xs leading-relaxed mb-3 p-3 rounded-xl"
                        style={{ background: '#F8FAFC', color: 'var(--muted)', borderLeft: '3px solid #E5E7EB' }}>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Activité : </span>
                        {d.descriptionActivite}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Consulter le dossier complet avant de décider */}
                      <button onClick={() => setDetailId(d.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={{ background: '#F1F5F9', color: '#0F172A' }}>
                        <Eye size={13} /> Voir le dossier
                      </button>
                      {d.statut === 'GENERE' && (
                        <button onClick={() => validerAdmin(d.id)} disabled={loadingId === d.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity"
                          style={{ background: '#1A56DB' }}>
                          <CheckCircle2 size={13} /> Valider le dossier
                        </button>
                      )}
                      {d.statut === 'VALIDE_ADMIN' && (
                        <button onClick={() => soumettrePADME(d.id)} disabled={loadingId === d.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity"
                          style={{ background: '#D97706' }}>
                          <Send size={13} /> Marquer soumis à PADME
                        </button>
                      )}
                      {d.statut === 'SOUMIS_PADME' && (<>
                        <button onClick={() => enregistrerResultat(d.id, 'ACCEPTE')} disabled={loadingId === d.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity"
                          style={{ background: '#2563EB' }}>
                          <CheckCircle2 size={13} /> Accepté par PADME
                        </button>
                        <button onClick={() => {
                          const c = window.prompt('Motif du rejet (optionnel) :')
                          if (c !== null) enregistrerResultat(d.id, 'REJETE', c)
                        }} disabled={loadingId === d.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity"
                          style={{ background: '#DC2626' }}>
                          <XCircle size={13} /> Rejeté
                        </button>
                      </>)}
                      <button onClick={() => exporterPdf(d.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={{ background: '#F3F4F6', color: 'var(--muted)' }}>
                        <Download size={13} /> Télécharger PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ Panneau de détail — dossier complet ═══ */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.45)' }}
            onClick={() => setDetailId(null)} />
          <div className="relative h-full w-full max-w-2xl overflow-y-auto"
            style={{ background: '#FFFFFF', boxShadow: '-8px 0 40px rgba(15,23,42,0.18)' }}>

            {detailLoading || !detail ? (
              <div className="p-8 text-sm" style={{ color: '#9CA3B8' }}>Chargement du dossier…</div>
            ) : (() => {
              const cfg = STATUT_CONFIG[detail.statut] ?? STATUT_CONFIG.GENERE
              const sc = detail.scoreCredit ?? {}
              const pts = {
                reg: Math.round((sc.tauxRegularite ?? 0) * 40),
                anc: Math.min((sc.totalMois ?? 0) * 2, 20),
                remb: Math.round((sc.scoreRemboursement ?? 0) * 30),
              }
              return (
                <>
                  {/* En-tête */}
                  <div className="sticky top-0 px-6 py-5 flex items-start gap-4"
                    style={{ background: '#1E3A8A', color: '#fff' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0"
                      style={{ background: 'rgba(255,255,255,0.18)' }}>
                      {(detail.client?.nom ?? 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg leading-tight">{detail.client?.nom ?? '—'}</p>
                      <p className="text-sm opacity-80">{detail.client?.telephone}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Pill label={cfg.label} color="#fff" bg="rgba(255,255,255,0.2)" />
                        {detail.client?.kycVerifie
                          ? <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md"
                              style={{ background: 'rgba(16,185,129,0.25)' }}><ShieldCheck size={12} /> KYC vérifié</span>
                          : <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md"
                              style={{ background: 'rgba(239,68,68,0.25)' }}><ShieldAlert size={12} /> KYC non vérifié</span>}
                      </div>
                    </div>
                    <button onClick={() => setDetailId(null)} className="p-2 rounded-lg shrink-0"
                      style={{ background: 'rgba(255,255,255,0.15)' }}><X size={16} /></button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Score détaillé */}
                    <section>
                      <h4 className="font-black text-sm mb-3" style={{ color: '#0F172A' }}>
                        Score de crédit — {detail.scoreAuMoment}/100 au moment du dossier
                      </h4>
                      <div className="rounded-xl p-4 space-y-2.5" style={{ background: '#F8FAFC' }}>
                        {[
                          ['Régularité des cotisations', `${Math.round((sc.tauxRegularite ?? 0) * 100)} %`, pts.reg, 40],
                          ['Historique de remboursement', `${Math.round((sc.scoreRemboursement ?? 0) * 100)} %`, pts.remb, 30],
                          ['Ancienneté', `${sc.totalMois ?? 0} mois`, pts.anc, 20],
                        ].map(([lab, val, p, max]) => (
                          <div key={String(lab)}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: '#0F172A' }} className="font-semibold">{lab}</span>
                              <span style={{ color: '#64748B' }}>{val} · <b style={{ color: '#2563EB' }}>{p}/{max} pts</b></span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                              <div className="h-full rounded-full"
                                style={{ width: `${(Number(p) / Number(max)) * 100}%`, background: '#2563EB' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ background: sc.eligiblePADME ? 'rgba(22,163,74,0.12)' : '#F3F4F6',
                                   color: sc.eligiblePADME ? '#16A34A' : '#9CA3B8' }}>
                          {sc.eligiblePADME ? '✓' : '✕'} Éligible PADME (≥ 70)
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ background: sc.eligibleMicroCredit ? 'rgba(22,163,74,0.12)' : '#F3F4F6',
                                   color: sc.eligibleMicroCredit ? '#16A34A' : '#9CA3B8' }}>
                          {sc.eligibleMicroCredit ? '✓' : '✕'} Éligible micro-crédit (≥ 60)
                        </span>
                      </div>
                    </section>

                    {/* Chiffres du dossier */}
                    <section>
                      <h4 className="font-black text-sm mb-3" style={{ color: '#0F172A' }}>Le dossier</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Épargne totale constituée', `${(detail.totalEpargneFcfa ?? 0).toLocaleString('fr-FR')} FCFA`],
                          ['Montant souhaité', detail.montantSouhaite != null ? `${detail.montantSouhaite.toLocaleString('fr-FR')} FCFA` : '—'],
                          ['Crédits déjà remboursés', `${detail.creditsRembourses ?? 0}`],
                          ['Taux de régularité', `${Math.round((detail.tauxRegularite ?? 0) * 100)} %`],
                        ].map(([lab, val]) => (
                          <div key={lab} className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                            <p className="text-xs mb-1" style={{ color: '#9CA3B8' }}>{lab}</p>
                            <p className="font-black text-sm" style={{ color: '#0F172A' }}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Activité + objet */}
                    <section className="space-y-3">
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: '#9CA3B8' }}>OBJET DU CRÉDIT</p>
                        <p className="text-sm" style={{ color: '#0F172A' }}>{detail.objetCredit ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: '#9CA3B8' }}>ACTIVITÉ DÉCLARÉE</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#0F172A' }}>
                          {detail.descriptionActivite ?? '—'}
                        </p>
                      </div>
                    </section>

                    {/* Traçabilité */}
                    <section>
                      <h4 className="font-black text-sm mb-3" style={{ color: '#0F172A' }}>Suivi</h4>
                      <div className="space-y-2">
                        {[
                          ['Dossier généré', detail.creeLe, `par ${detail.genereePar ?? '—'}`],
                          ['Soumis à PADME', detail.soumisLe, ''],
                          ['Examiné', detail.examineLE, ''],
                        ].filter(([, d]) => d).map(([lab, d, extra]) => (
                          <div key={String(lab)} className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2563EB' }} />
                            <span className="font-semibold" style={{ color: '#0F172A' }}>{lab}</span>
                            <span style={{ color: '#9CA3B8' }}>{fmtDate(String(d))} {extra}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#CBD5E1' }} />
                          <span className="font-semibold" style={{ color: '#0F172A' }}>Client inscrit</span>
                          <span style={{ color: '#9CA3B8' }}>{detail.client?.creeLe ? fmtDate(detail.client.creeLe) : '—'}</span>
                        </div>
                      </div>
                    </section>

                    {/* Décider depuis le panneau */}
                    <section className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <button onClick={() => exporterPdf(detail.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold mt-4"
                        style={{ background: '#F3F4F6', color: '#0F172A' }}>
                        <Download size={13} /> Télécharger le PDF
                      </button>
                      {detail.statut === 'GENERE' && (
                        <button onClick={async () => { await validerAdmin(detail.id); setDetailId(null) }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white mt-4"
                          style={{ background: '#1A56DB' }}>
                          <CheckCircle2 size={13} /> Valider le dossier
                        </button>
                      )}
                      {detail.statut === 'VALIDE_ADMIN' && (
                        <button onClick={async () => { await soumettrePADME(detail.id); setDetailId(null) }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white mt-4"
                          style={{ background: '#D97706' }}>
                          <Send size={13} /> Marquer soumis à PADME
                        </button>
                      )}
                    </section>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
