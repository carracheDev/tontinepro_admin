'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titre="En attente" valeur={retraits.length} icone={Clock}
          couleur="var(--warning)" badge={retraits.length > 0 ? 'urgent' : undefined} badgeCouleur="var(--warning)" />
        <KpiCard titre="Volume en attente" valeur={fmtFcfa(totalEnAttente)} icone={Wallet} couleur="var(--warning)" />
        <KpiCard titre="Montant max" valeur={fmtFcfa(montantMax)} icone={TrendingUp} couleur="var(--danger)" />
        <KpiCard titre="Seuil validation" valeur="50 000 FCFA" icone={BadgeCheck} couleur="var(--primary)" />
      </div>

      {/* Courbe volume 7 jours */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Volume retraits — 7 derniers jours</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Montants demandés (tous statuts)</p>
          </div>
          <LiveBadge />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRetrait" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
              formatter={(v) => [fmtFcfa(Number(v)), 'Volume']} cursor={{ stroke: 'var(--warning)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="montant" stroke="var(--warning)" strokeWidth={2}
              fill="url(#gRetrait)" dot={{ fill: 'var(--warning)', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* File d'approbation */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          <h2 className="font-bold flex-1" style={{ color: 'var(--foreground)' }}>
            File d&apos;approbation
          </h2>
          {retraits.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--warning)' }}>
              {retraits.length} en attente
            </span>
          )}
          <LiveBadge />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: 'var(--muted)' }}>
            <Clock size={20} className="animate-spin" /> Chargement...
          </div>
        ) : retraits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <CheckCircle size={40} className="mb-3 opacity-30" />
            <p className="font-semibold">File vide — aucun retrait en attente</p>
            <p className="text-xs mt-1 opacity-70">Les retraits ≥ 50 000 FCFA apparaissent ici</p>
          </div>
        ) : (
          <div>
            {retraits.map((r, i) => (
              <div key={r.id} className="px-6 py-5" style={{ borderBottom: i < retraits.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: 'var(--primary)', fontSize: 13 }}>
                      {r.utilisateur?.nom?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--foreground)' }}>{r.utilisateur?.nom}</p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {r.utilisateur?.telephone}
                        {r.tontine && ` · ${r.tontine.emoji ?? '🪣'} ${r.tontine.nom}`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {fmtDate(r.creeLe)}
                        {r.operateur && ` · ${r.operateur}`}
                        {r.numeroDest && ` · ${r.numeroDest}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
                      {r.montantFcfa.toLocaleString('fr-FR')} FCFA
                    </p>
                    {r.montantNetFcfa && r.montantNetFcfa !== r.montantFcfa && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Net client : {r.montantNetFcfa.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => setRejetId(r.id)}
                    disabled={loadingId === r.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <XCircle size={16} /> Rejeter
                  </button>
                  <button onClick={() => valider(r.id)}
                    disabled={loadingId === r.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'var(--primary)' }}>
                    <CheckCircle size={16} />
                    {loadingId === r.id ? 'Traitement…' : 'Approuver'}
                  </button>
                  <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
                    ID : {r.id.slice(0, 8)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
