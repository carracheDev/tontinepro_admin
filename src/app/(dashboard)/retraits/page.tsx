'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  Wallet, TrendingUp, Timer, BadgeCheck,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import KpiCard from '@/components/dashboard/kpi-card'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
function fmtFcfa(n: number) { return fmt(n) + ' FCFA' }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type Retrait = {
  id: string
  montantFcfa: number
  montantNetFcfa?: number
  statut: string
  creeLe: string
  operateur?: string
  numeroDest?: string
  utilisateur: { nom: string; telephone: string }
  tontine: { nom: string; emoji?: string }
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--warning)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      refresh 15s
    </span>
  )
}

function ModalRejet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motif, setMotif] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#fff' }}>
        <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Motif de rejet</h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Le client sera notifié par <strong>FCM, SMS et in-app</strong>.
        </p>
        <textarea
          value={motif} onChange={e => setMotif(e.target.value)} rows={3}
          placeholder="Ex : Informations incorrectes, solde insuffisant..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1.5px solid var(--border)' }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F3F4F6', color: 'var(--muted)' }}>Annuler</button>
          <button onClick={() => motif.trim() && onConfirm(motif.trim())}
            disabled={!motif.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--danger)' }}>Confirmer le rejet</button>
        </div>
      </div>
    </div>
  )
}

export default function RetraitsPage() {
  const { data, mutate, isLoading } = useSWR('/retraits/en-attente', fetcher, { refreshInterval: 15_000 })
  const { data: historique } = useSWR('/retraits/mes-retraits?limite=100', fetcher)

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejetId, setRejetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const retraits: Retrait[] = Array.isArray(data) ? data : data?.retraits ?? []

  // Calcul stats
  const totalEnAttente = retraits.reduce((s, r) => s + r.montantFcfa, 0)
  const montantMax = retraits.length > 0 ? Math.max(...retraits.map(r => r.montantFcfa)) : 0

  // Historique en courbe — 7 derniers jours
  const listHisto: Retrait[] = Array.isArray(historique) ? historique : historique?.retraits ?? []
  const areaData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    const total = listHisto
      .filter(r => {
        const dr = new Date(r.creeLe)
        return dr.getDate() === d.getDate() && dr.getMonth() === d.getMonth()
      })
      .reduce((s, r) => s + r.montantFcfa, 0)
    return { jour: label, montant: total }
  })

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  async function valider(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/retraits/${id}/valider`)
      showToast('ok', '✅ Retrait approuvé — KKiaPay traite le virement')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  async function rejeter(id: string, motif: string) {
    setRejetId(null)
    setLoadingId(id)
    try {
      await api.put(`/retraits/${id}/rejeter`, { motif })
      showToast('err', '❌ Retrait rejeté — client notifié')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-6 max-w-350">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {toast.text}
        </div>
      )}

      {/* Modal rejet */}
      {rejetId && <ModalRejet onClose={() => setRejetId(null)} onConfirm={(m) => rejeter(rejetId, m)} />}

      {/* KPIs — Design moderne — CHARTE COHÉRENTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { titre: 'En attente', valeur: retraits.length, icone: Clock, couleur: COLORS.warning, trend: retraits.length > 5 ? 18 : -3 },
          { titre: 'Volume en attente', valeur: fmtFcfa(totalEnAttente), icone: Wallet, couleur: COLORS.warning, trend: 22 },
          { titre: 'Montant max', valeur: fmtFcfa(montantMax), icone: TrendingUp, couleur: COLORS.danger, trend: 7 },
          { titre: 'Seuil validation', valeur: '50 000 FCFA', icone: BadgeCheck, couleur: COLORS.primary, trend: 0 },
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
              {trend !== 0 && (
                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: trend > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: trend > 0 ? '#EF4444' : '#10B981',
                  }}
                >
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
              )}
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

      {/* Courbe volume 7 jours — MODERNE */}
      <div
        className="rounded-2xl p-6 transition-all"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-black text-base" style={{ color: '#0F172A' }}>
              Volume retraits — 7 derniers jours
            </h3>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>
              Montants demandés (tous statuts)
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl" style={{ color: '#F59E0B', background: '#FFFBEB', border: '1px solid #FEE3B2' }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            refresh 15s
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRetrait" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '10px 14px' }}
              formatter={(v) => [fmtFcfa(Number(v)), 'Volume']}
              cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 2' }}
            />
            <Area type="monotone" dataKey="montant" stroke="#F59E0B" strokeWidth={2.5}
              fill="url(#gRetrait)" dot={{ fill: '#F59E0B', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#F59E0B', strokeWidth: 3, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* File d'approbation — RETRAIT CARDS MODERNES */}
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-black text-2xl" style={{ color: '#0F172A' }}>
              File d&apos;approbation
            </h2>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>
              {retraits.length} retrait{retraits.length !== 1 ? 's' : ''} ≥ 50 000 FCFA en attente
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl" style={{ color: '#F59E0B', background: '#FFFBEB', border: '1px solid #FEE3B2' }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Live
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: '#9CA3B8' }}>
            <Clock size={20} className="animate-spin" />
            <span className="text-sm font-medium">Chargement des retraits...</span>
          </div>
        ) : retraits.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#EFF4FF' }}>
              <CheckCircle size={32} style={{ color: '#2563EB', opacity: 0.5 }} />
            </div>
            <p className="font-bold text-base" style={{ color: '#0F172A' }}>File vide</p>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>Aucun retrait ≥ 50 000 FCFA en attente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {retraits.map((r) => (
              <div
                key={r.id}
                className="rounded-3xl p-6 transition-all border-2"
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #F59E0B35',
                  boxShadow: '0 4px 16px #F59E0B18',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px #F59E0B25, 0 0 0 8px #F59E0B08'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#F59E0B50'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px #F59E0B18'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#F59E0B35'
                }}
              >
                {/* En-tête : Avatar + Infos */}
                <div className="flex items-start justify-between gap-5 mb-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: '#2563EB', fontSize: 18 }}
                    >
                      {r.utilisateur?.nom?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base" style={{ color: '#0F172A' }}>
                        {r.utilisateur?.nom}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                        {r.utilisateur?.telephone}
                      </p>
                      {r.tontine && (
                        <p className="text-sm mt-1" style={{ color: '#9CA3B8' }}>
                          {r.tontine.emoji ?? '🪣'} <span style={{ color: '#0F172A', fontWeight: '600' }}>{r.tontine.nom}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Montant GROS */}
                  <div className="text-right shrink-0">
                    <p className="text-5xl font-black" style={{ color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
                      {r.montantFcfa.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs font-bold mt-1" style={{ color: '#6B7280' }}>FCFA</p>
                    {r.montantNetFcfa && r.montantNetFcfa !== r.montantFcfa && (
                      <p className="text-xs mt-2" style={{ color: '#9CA3B8' }}>
                        Net : {r.montantNetFcfa.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                </div>

                {/* Métadonnées */}
                <p className="text-xs mb-5" style={{ color: '#9CA3B8' }}>
                  {fmtDate(r.creeLe)}
                  {r.operateur && ` · ${r.operateur}`}
                  {r.numeroDest && ` · ${r.numeroDest}`}
                  {' '}· ID : {r.id.slice(0, 8)}…
                </p>

                {/* Boutons d'action */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setRejetId(r.id)}
                    disabled={loadingId === r.id}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    style={{
                      background: '#FECACA',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                    }}
                  >
                    <XCircle size={18} />
                    <span>Rejeter</span>
                  </button>
                  <button
                    onClick={() => valider(r.id)}
                    disabled={loadingId === r.id}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: '#2563EB' }}
                  >
                    <CheckCircle size={18} />
                    <span>{loadingId === r.id ? 'Traitement…' : 'Approuver'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
