'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Retrait = {
  id: string
  montantFcfa: number
  statut: string
  creeLe: string
  operateur?: string
  utilisateur: { nom: string; telephone: string }
  tontine: { nom: string }
}

export default function RetraitsPage() {
  const { data, mutate, isLoading } = useSWR('/retraits/en-attente', fetcher)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [motifs, setMotifs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const retraits: Retrait[] = Array.isArray(data) ? data : []

  async function valider(id: string) {
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/retraits/${id}/valider`)
      setMsg({ type: 'ok', text: 'Retrait approuvé ✓ — KKiaPay traite le virement.' })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally {
      setLoadingId(null)
    }
  }

  async function rejeter(id: string) {
    const motif = motifs[id]?.trim()
    if (!motif) {
      setMsg({ type: 'err', text: 'Le motif de rejet est obligatoire.' })
      return
    }
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/retraits/${id}/rejeter`, { motif })
      setMsg({ type: 'ok', text: 'Retrait rejeté.' })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.2)', color: 'var(--info)' }}>
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>Seuls les retraits ≥ 50 000 FCFA nécessitent une validation admin. Les autres sont traités automatiquement.</span>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: msg.type === 'ok' ? 'rgba(10,124,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'ok' ? 'var(--primary)' : 'var(--danger)' }}>
          {msg.text}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            Retraits en attente
            {retraits.length > 0 && (
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--warning)' }}>
                {retraits.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <Clock size={24} className="animate-spin mr-2" /> Chargement...
          </div>
        ) : retraits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <CheckCircle size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Aucun retrait en attente</p>
          </div>
        ) : (
          <div className="space-y-0">
            {retraits.map((r) => (
              <div key={r.id} className="px-6 py-5 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--foreground)' }}>{r.utilisateur?.nom}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{r.utilisateur?.telephone} · {r.tontine?.nom}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                      {new Date(r.creeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {r.operateur && ` · ${r.operateur}`}
                    </p>
                  </div>
                  <p className="text-2xl font-black" style={{ color: 'var(--warning)', fontFamily: 'monospace' }}>
                    {r.montantFcfa.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>

                {/* Motif rejet + boutons */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    placeholder="Motif de rejet (obligatoire si refus)..."
                    value={motifs[r.id] ?? ''}
                    onChange={e => setMotifs(p => ({ ...p, [r.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: '#F9FAFB', border: '1px solid var(--border)' }}
                  />
                  <button onClick={() => valider(r.id)} disabled={loadingId === r.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'var(--primary)' }}>
                    <CheckCircle size={15} /> Approuver
                  </button>
                  <button onClick={() => rejeter(r.id)} disabled={loadingId === r.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'var(--danger)' }}>
                    <XCircle size={15} /> Rejeter
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
