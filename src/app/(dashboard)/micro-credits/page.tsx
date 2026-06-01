'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { CreditCard, CheckCircle, XCircle, TrendingUp, Clock, AlertTriangle } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type CreditAttente = {
  id: string
  montantPrincipalFcfa: number
  montantTotalFcfa: number
  paiementJournalierFcfa: number
  scoreAuMoment: number
  statut: string
  creeLe: string
  client: { nom: string; telephone: string; kycVerifie: boolean }
}

type CreditActif = {
  id: string
  statut: string
  montantPrincipalFcfa: number
  montantTotalFcfa: number
  montantRembourse: number
  montantRestantFcfa: number
  paiementJournalierFcfa: number
  joursPayes: number
  totalJours: number
  progressionPct: number
  joursRestants: number | null
  dateEcheance: string | null
  decaisseLE: string | null
  scoreAuMoment: number
  client: { nom: string; telephone: string; kycVerifie: boolean }
}

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function ProgressBar({ pct, statut }: { pct: number; statut: string }) {
  const color = statut === 'EN_DEFAUT' ? '#DC2626' : statut === 'TERMINE' ? '#16A34A' : '#1A56DB'
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: '#F3F4F6' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
    </div>
  )
}

function BadgeStatut({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    EN_ATTENTE: { label: 'En attente',  bg: 'rgba(217,119,6,0.1)',  color: '#D97706', icon: <Clock size={11} /> },
    ACTIF:      { label: 'Actif',       bg: 'rgba(26,86,219,0.1)',  color: '#1A56DB', icon: <TrendingUp size={11} /> },
    EN_DEFAUT:  { label: 'En défaut',   bg: 'rgba(220,38,38,0.1)',  color: '#DC2626', icon: <AlertTriangle size={11} /> },
    TERMINE:    { label: 'Terminé',     bg: 'rgba(22,163,74,0.1)',  color: '#16A34A', icon: <CheckCircle size={11} /> },
    REFUSE:     { label: 'Refusé',      bg: 'rgba(107,114,128,0.1)',color: '#6B7280', icon: <XCircle size={11} /> },
  }
  const s = map[statut] ?? { label: statut, bg: '#F3F4F6', color: '#6B7280', icon: null }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  )
}

export default function MicroCreditsPage() {
  const { data: dataAttente, mutate: mutateAttente } = useSWR('/micro-credits/en-attente', fetcher)
  const { data: dataActifs,  mutate: mutateActifs  } = useSWR('/micro-credits/actifs', fetcher)

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [motifs, setMotifs]       = useState<Record<string, string>>({})
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const attente: CreditAttente[] = Array.isArray(dataAttente) ? dataAttente : []
  const actifs:  CreditActif[]   = Array.isArray(dataActifs)  ? dataActifs  : []

  async function valider(id: string) {
    setLoadingId(id); setMsg(null)
    try {
      await api.put(`/micro-credits/${id}/valider`)
      setMsg({ type: 'ok', text: 'Micro-crédit approuvé et décaissé ✓' })
      mutateAttente(); mutateActifs()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  async function refuser(id: string) {
    const motif = motifs[id]?.trim()
    if (!motif) { setMsg({ type: 'err', text: 'Le motif de refus est obligatoire.' }); return }
    setLoadingId(id); setMsg(null)
    try {
      await api.put(`/micro-credits/${id}/refuser`, { motif })
      setMsg({ type: 'ok', text: 'Micro-crédit refusé.' })
      mutateAttente()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: msg.type === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                   color: msg.type === 'ok' ? '#16A34A' : '#DC2626' }}>
          {msg.text}
        </div>
      )}

      {/* ── Section 1 : En attente de validation ──────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Clock size={18} style={{ color: '#D97706' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            En attente de validation
          </h2>
          {attente.length > 0 && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
              {attente.length}
            </span>
          )}
        </div>

        {attente.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--muted)' }}>
            <CheckCircle size={36} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">Aucune demande en attente</p>
          </div>
        ) : (
          <div>
            {attente.map((c) => (
              <div key={c.id} className="px-6 py-5 border-b last:border-0" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>{c.client.nom}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{c.client.telephone}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        Score : <strong style={{ color: '#1A56DB' }}>{c.scoreAuMoment}/100</strong>
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(c.creeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black" style={{ color: '#1A56DB', fontFamily: 'monospace' }}>
                      {fmt(c.montantPrincipalFcfa)} FCFA
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      Total dû : {fmt(c.montantTotalFcfa)} FCFA · {fmt(c.paiementJournalierFcfa)} FCFA/j
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input placeholder="Motif de refus (obligatoire si refus)..."
                    value={motifs[c.id] ?? ''}
                    onChange={e => setMotifs(p => ({ ...p, [c.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: '#fff', border: '1px solid var(--border)' }} />
                  <button onClick={() => valider(c.id)} disabled={loadingId === c.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 shrink-0"
                    style={{ background: '#16A34A' }}>
                    <CheckCircle size={15} /> Approuver
                  </button>
                  <button onClick={() => refuser(c.id)} disabled={loadingId === c.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 shrink-0"
                    style={{ background: '#DC2626' }}>
                    <XCircle size={15} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2 : Crédits actifs — suivi remboursement ──────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <TrendingUp size={18} style={{ color: '#1A56DB' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            Suivi des remboursements
          </h2>
          {actifs.length > 0 && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(26,86,219,0.1)', color: '#1A56DB' }}>
              {actifs.length}
            </span>
          )}
        </div>

        {actifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--muted)' }}>
            <CreditCard size={36} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">Aucun crédit actif</p>
          </div>
        ) : (
          <div>
            {actifs.map((c) => (
              <div key={c.id} className="px-6 py-5 border-b last:border-0" style={{ borderColor: '#E2E8F0' }}>
                {/* En-tête client + statut */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>{c.client.nom}</p>
                      <BadgeStatut statut={c.statut} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{c.client.telephone}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        Score : <strong style={{ color: '#7C3AED' }}>{c.scoreAuMoment}/100</strong>
                      </span>
                      {c.decaisseLE && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          Décaissé le {new Date(c.decaisseLE).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>
                      {fmt(c.montantPrincipalFcfa)} FCFA
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {fmt(c.paiementJournalierFcfa)} FCFA/jour · 30 jours
                    </p>
                  </div>
                </div>

                {/* Barre de progression remboursement */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                    <span>Remboursé : <strong style={{ color: c.statut === 'EN_DEFAUT' ? '#DC2626' : '#16A34A' }}>
                      {fmt(c.montantRembourse)} FCFA
                    </strong></span>
                    <span><strong>{c.progressionPct}%</strong></span>
                  </div>
                  <ProgressBar pct={c.progressionPct} statut={c.statut} />
                  <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                    <span>Restant : <strong>{fmt(c.montantRestantFcfa)} FCFA</strong></span>
                    <span>Total : {fmt(c.montantTotalFcfa)} FCFA</span>
                  </div>
                </div>

                {/* Métriques jours */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#F8FAFC' }}>
                    <p className="text-lg font-black" style={{ color: '#1A56DB' }}>{c.joursPayes}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>jours payés</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#F8FAFC' }}>
                    <p className="text-lg font-black" style={{ color: c.statut === 'EN_DEFAUT' ? '#DC2626' : 'var(--foreground)' }}>
                      {c.totalJours - c.joursPayes}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>jours restants</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#F8FAFC' }}>
                    <p className="text-lg font-black" style={{
                      color: c.joursRestants !== null && c.joursRestants <= 3 && c.statut === 'ACTIF'
                        ? '#DC2626' : 'var(--foreground)'
                    }}>
                      {c.joursRestants !== null ? c.joursRestants : '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>j. avant échéance</p>
                  </div>
                </div>

                {/* Alerte défaut */}
                {c.statut === 'EN_DEFAUT' && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <AlertTriangle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <p className="text-xs font-medium" style={{ color: '#DC2626' }}>
                      Ce client est en défaut de paiement. Prélèvements KKiaPay échoués.
                    </p>
                  </div>
                )}

                {/* Succès terminé */}
                {c.statut === 'TERMINE' && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <CheckCircle size={15} style={{ color: '#16A34A', flexShrink: 0 }} />
                    <p className="text-xs font-medium" style={{ color: '#16A34A' }}>
                      Crédit entièrement remboursé.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
