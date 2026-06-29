'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import {
  ArrowLeft, Shield, ShieldCheck, ShieldX, ShieldAlert,
  Star, Wallet, CreditCard, ReceiptText,
  CheckCircle2, XCircle, Clock, BadgeCheck,
  User, Phone, Calendar, Award,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
function fmtFcfa(n: number) { return fmt(n) + ' FCFA' }
function fmtDate(d: string)  {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DocKyc = {
  id: string
  typeDocument: string
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'
  motifRejet?: string
  cheminFichier?: string
  creeLe: string
}

type FicheClient = {
  id: string; nom: string; telephone: string; role: string
  statut: string; kycVerifie: boolean; creeLe: string
  scoreCredit?: {
    score: number; tauxRegularite: number
    eligibleMicroCredit: boolean; eligiblePADME: boolean
    badges?: { niveau: string }[]
  }
  documentsKYC: DocKyc[]
  tontines: { id: string; nom: string; emoji: string; type: string; statut: string; soldeActuelFcfa: number }[]
  transactions: { id: string; type: string; montantFcfa: number; statut: string; operateur: string; creeLe: string }[]
  microCredits: { id: string; montantPrincipalFcfa: number; montantRestantFcfa: number; statut: string; dateEcheance?: string }[]
  collecteur?: { nom: string; telephone: string }
  soldeTotal: number
  volumeCotisations: number
  _count: { tontines: number; transactions: number; microCredits: number; retraits: number }
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: '#fff', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
      {children}
    </h2>
  )
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color, background: bg }}>
      {label}
    </span>
  )
}

function StatBox({ label, value, color = 'var(--foreground)' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-black" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

// ─── Statut KYC document ─────────────────────────────────────────────────────

const KYC_STATUT = {
  VALIDE:     { icon: CheckCircle2, color: '#2563EB', bg: 'rgba(22,163,74,0.1)',  label: 'Validé'     },
  EN_ATTENTE: { icon: Clock,        color: '#D97706', bg: 'rgba(217,119,6,0.1)',  label: 'En attente' },
  REJETE:     { icon: XCircle,      color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  label: 'Rejeté'     },
}

const TYPE_LABEL: Record<string, string> = {
  CNI: 'Carte CIP (CNI)', PASSEPORT: 'Passeport',
  PERMIS: 'Permis de conduire', ACTE_NAISSANCE: 'Acte de naissance',
}

// ─── Carte document KYC ───────────────────────────────────────────────────────

function DocKycCard({ doc, onValider, onRejeter }: {
  doc: DocKyc
  onValider: () => void
  onRejeter: () => void
}) {
  const st = KYC_STATUT[doc.statut] ?? KYC_STATUT.EN_ATTENTE
  const Icon = st.icon

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${st.color}30`, background: '#FAFAFA' }}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.bg }}>
          <Icon size={20} style={{ color: st.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {TYPE_LABEL[doc.typeDocument] ?? doc.typeDocument}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Soumis le {fmtDate(doc.creeLe)}
          </p>
        </div>
        <Pill label={st.label} color={st.color} bg={st.bg} />
      </div>

      {/* Motif rejet */}
      {doc.statut === 'REJETE' && doc.motifRejet && (
        <div className="px-4 pb-3">
          <p className="text-xs italic" style={{ color: '#DC2626' }}>
            Motif : {doc.motifRejet}
          </p>
        </div>
      )}

      {/* Lien vers le document */}
      {doc.cheminFichier && (
        <div className="px-4 pb-3">
          <a
            href={doc.cheminFichier}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold underline"
            style={{ color: 'var(--primary)' }}
          >
            Voir le document →
          </a>
        </div>
      )}

      {/* Boutons action — seulement EN_ATTENTE */}
      {doc.statut === 'EN_ATTENTE' && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onRejeter}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            <XCircle size={14} />
            Rejeter
          </button>
          <button
            onClick={onValider}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: '#2563EB', color: '#fff' }}
          >
            <CheckCircle2 size={14} />
            Valider
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Modal rejet ──────────────────────────────────────────────────────────────

function ModalRejet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (motif: string) => void }) {
  const [motif, setMotif] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#fff' }}>
        <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
          Motif de rejet
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Le client recevra une notification <strong>FCM</strong>, <strong>SMS</strong> et <strong>in-app</strong> avec ce motif.
        </p>
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          rows={3}
          placeholder="Ex : Document illisible, photo floue, document expiré..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F3F4F6', color: 'var(--muted)' }}>
            Annuler
          </button>
          <button
            onClick={() => motif.trim() && onConfirm(motif.trim())}
            disabled={!motif.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: '#DC2626', color: '#fff' }}
          >
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [rejetDocId, setRejetDocId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const { data: client, mutate, isLoading } = useSWR<FicheClient>(
    `/utilisateurs/${id}`,
    fetcher,
  )

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  async function validerDoc(docId: string) {
    setLoading(docId)
    try {
      await api.put(`/kyc/${docId}/valider`)
      showToast('ok', '✅ Document validé — notification FCM + SMS + in-app envoyée')
      mutate()
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setLoading(null)
    }
  }

  async function rejeterDoc(docId: string, motif: string) {
    setRejetDocId(null)
    setLoading(docId)
    try {
      await api.put(`/kyc/${docId}/rejeter`, { motifRejet: motif })
      showToast('err', '❌ Document rejeté — notification FCM + SMS + in-app envoyée')
      mutate()
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setLoading(null)
    }
  }

  async function toggleStatut() {
    if (!client) return
    setLoading('statut')
    try {
      const estActif = client.statut === 'ACTIF'
      await api.put(`/utilisateurs/${id}/statut`, {
        statut: estActif ? 'SUSPENDU' : 'ACTIF',
      })
      showToast('ok', `Compte ${estActif ? 'suspendu' : 'réactivé'} ✓`)
      mutate()
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setLoading(null)
    }
  }

  // ── Score color ─────────────────────────────────────────────────────────────
  function scoreColor(s: number) {
    if (s >= 75) return '#2563EB'
    if (s >= 60) return '#1A56DB'
    if (s >= 40) return '#D97706'
    return '#DC2626'
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200" style={{ borderTopColor: 'var(--primary)' }} />
    </div>
  )

  if (!client) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <ShieldX size={40} style={{ color: 'var(--muted)' }} />
      <p style={{ color: 'var(--muted)' }}>Client introuvable</p>
    </div>
  )

  const score = client.scoreCredit
  const docEnAttente = client.documentsKYC.filter(d => d.statut === 'EN_ATTENTE').length

  return (
    <div className="space-y-6 max-w-350">

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* ── Modal rejet ──────────────────────────────────────────────────────── */}
      {rejetDocId && (
        <ModalRejet
          onClose={() => setRejetDocId(null)}
          onConfirm={(motif) => rejeterDoc(rejetDocId, motif)}
        />
      )}

      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
          style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <ArrowLeft size={14} /> Retour
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black" style={{ color: 'var(--foreground)' }}>
            {client.nom}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{client.telephone}</span>
            {(() => {
              const s = client.statut
              const cfg: Record<string, { label: string; color: string; bg: string }> = {
                ACTIF:      { label: '✓ Actif',        color: '#2563EB', bg: 'rgba(22,163,74,0.1)'   },
                SUSPENDU:   { label: '⛔ Suspendu',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
                BLOQUE:     { label: '🔒 Bloqué',       color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
                EN_ATTENTE: { label: '⏳ En attente',   color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
                INACTIF:    { label: 'Inactif',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
              }
              const c = cfg[s] ?? { label: s, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
              return <Pill label={c.label} color={c.color} bg={c.bg} />
            })()}
            {client.kycVerifie && (
              <Pill label="KYC ✓" color="#2563EB" bg="rgba(22,163,74,0.1)" />
            )}
            {docEnAttente > 0 && (
              <Pill label={`${docEnAttente} KYC en attente`} color="#D97706" bg="rgba(217,119,6,0.1)" />
            )}
          </div>
        </div>
        {client.statut !== 'TERMINEE' && client.statut !== 'INACTIF' && (
          <button
            onClick={toggleStatut}
            disabled={loading === 'statut'}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40 shrink-0"
            style={{
              background: client.statut === 'ACTIF' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
              color: client.statut === 'ACTIF' ? '#DC2626' : '#2563EB',
              border: `1px solid ${client.statut === 'ACTIF' ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`,
            }}
          >
            {client.statut === 'ACTIF' ? '⛔ Suspendre' : '✅ Réactiver'}
          </button>
        )}
      </div>

      {/* ── Infos + Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Infos de base */}
        <Card>
          <SectionTitle>Informations</SectionTitle>
          <div className="space-y-3">
            {[
              { icon: User,     label: 'Nom',        value: client.nom },
              { icon: Phone,    label: 'Téléphone',   value: client.telephone },
              { icon: Calendar, label: 'Inscrit le',  value: fmtDate(client.creeLe) },
              { icon: Award,    label: 'Collecteur',  value: client.collecteur?.nom ?? '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--primary-light)' }}>
                  <Icon size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats financières */}
        <Card>
          <SectionTitle>Activité financière</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Épargne totale"     value={fmtFcfa(client.soldeTotal)} color="var(--primary)" />
            <StatBox label="Vol. cotisations"   value={fmtFcfa(client.volumeCotisations)} color="var(--primary)" />
            <StatBox label="Tontines"           value={client._count.tontines} />
            <StatBox label="Transactions"       value={client._count.transactions} />
            <StatBox label="Micro-crédits"      value={client._count.microCredits} />
            <StatBox label="Retraits"           value={client._count.retraits} />
          </div>
        </Card>

        {/* Score crédit */}
        <Card>
          <SectionTitle>Score crédit</SectionTitle>
          {score ? (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: scoreColor(score.score), fontVariantNumeric: 'tabular-nums' }}>
                  {score.score}
                </span>
                <span className="text-lg font-bold mb-1" style={{ color: 'var(--muted)' }}>/100</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${score.score}%`, background: scoreColor(score.score) }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill label={`Régularité ${Math.round(score.tauxRegularite * 100)}%`} color="#1A56DB" bg="rgba(26,86,219,0.1)" />
                {score.eligibleMicroCredit && <Pill label="Éligible crédit ✓" color="#7C3AED" bg="rgba(124,58,237,0.1)" />}
                {score.eligiblePADME      && <Pill label="Éligible PADME ✓"  color="#2563EB" bg="rgba(22,163,74,0.1)" />}
                {score.badges?.[0]        && <Pill label={`${score.badges[0].niveau}`} color="#D97706" bg="rgba(217,119,6,0.1)" />}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Score non calculé</p>
          )}
        </Card>
      </div>

      {/* ── KYC ───────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {client.kycVerifie
            ? <ShieldCheck size={16} style={{ color: '#2563EB' }} />
            : <ShieldAlert size={16} style={{ color: '#D97706' }} />
          }
          <SectionTitle>
            Vérification KYC
            {docEnAttente > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-white text-xs font-bold"
                style={{ background: '#D97706' }}>
                {docEnAttente} en attente
              </span>
            )}
          </SectionTitle>
        </div>
        {client.documentsKYC.length === 0 ? (
          <Card>
            <div className="flex items-center gap-3">
              <Shield size={24} style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Aucun document KYC soumis.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {client.documentsKYC.map(doc => (
              <DocKycCard
                key={doc.id}
                doc={doc}
                onValider={() => !loading && validerDoc(doc.id)}
                onRejeter={() => !loading && setRejetDocId(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Tontines ──────────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Tontines ({client._count.tontines})</SectionTitle>
        {client.tontines.length === 0
          ? <Card><p className="text-sm" style={{ color: 'var(--muted)' }}>Aucune tontine.</p></Card>
          : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            {client.tontines.map((t, i) => {
              const stColor = { ACTIVE: '#2563EB', SUSPENDUE: '#D97706', TERMINEE: '#9CA3AF', CREATION: '#1A56DB' }[t.statut] ?? '#9CA3AF'
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0"
                  style={{ borderColor: '#E2E8F0' }}>
                  <span className="text-xl shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{t.nom}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{t.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm" style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtFcfa(t.soldeActuelFcfa)}
                    </p>
                    <span className="text-xs font-bold" style={{ color: stColor }}>{t.statut}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Transactions récentes ─────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Dernières transactions</SectionTitle>
        {client.transactions.length === 0
          ? <Card><p className="text-sm" style={{ color: 'var(--muted)' }}>Aucune transaction.</p></Card>
          : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                    {['Type', 'Montant', 'Opérateur', 'Statut', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                        style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {client.transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{tx.type}</td>
                      <td className="px-5 py-3 text-sm font-black" style={{ color: tx.type === 'RETRAIT' ? '#DC2626' : '#2563EB', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtFcfa(tx.montantFcfa)}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--muted)' }}>{tx.operateur}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: tx.statut === 'SUCCES' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: tx.statut === 'SUCCES' ? '#2563EB' : '#DC2626' }}>
                          {tx.statut}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--muted)' }}>{fmtDate(tx.creeLe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Micro-crédits ─────────────────────────────────────────────────────── */}
      {client.microCredits.length > 0 && (
        <div>
          <SectionTitle>Micro-crédits</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.microCredits.map(c => {
              const progress = c.montantPrincipalFcfa > 0
                ? (1 - c.montantRestantFcfa / c.montantPrincipalFcfa)
                : 0
              const stColor = { ACTIF: '#7C3AED', TERMINE: '#2563EB', EN_DEFAUT: '#DC2626', EN_ATTENTE: '#D97706', REFUSE: '#9CA3AF' }[c.statut] ?? '#9CA3AF'
              return (
                <Card key={c.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtFcfa(c.montantPrincipalFcfa)}
                    </span>
                    <Pill label={c.statut} color={stColor} bg={`${stColor}18`} />
                  </div>
                  {c.statut === 'ACTIF' && (
                    <>
                      <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                        <span>Restant : {fmtFcfa(c.montantRestantFcfa)}</span>
                        <span>{Math.round(progress * 100)}% remboursé</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                        <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: '#7C3AED' }} />
                      </div>
                      {c.dateEcheance && (
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          Échéance : {fmtDate(c.dateEcheance)}
                        </p>
                      )}
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
