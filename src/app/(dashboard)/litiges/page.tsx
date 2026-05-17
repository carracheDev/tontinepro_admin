'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { Scale, CheckCircle, XCircle, Eye } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Litige = {
  id: string; sujet: string; description: string; statut: string; creeLe: string
  auteur: { nom: string; telephone: string }
}

const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  OUVERT:   { bg: 'rgba(220,38,38,0.1)',  color: 'var(--danger)'  },
  EN_COURS: { bg: 'rgba(217,119,6,0.1)',  color: 'var(--warning)' },
  RESOLU:   { bg: 'rgba(10,124,74,0.1)',  color: 'var(--primary)' },
  REJETE:   { bg: 'rgba(107,114,128,0.1)',color: 'var(--muted)'   },
}

export default function LitigesPage() {
  const { data, mutate } = useSWR('/litiges/en-cours/liste', fetcher)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [motifs, setMotifs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const litiges: Litige[] = data?.litiges ?? data ?? []

  async function examiner(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/litiges/${id}/examiner`)
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  async function resoudre(id: string) {
    const resolution = resolutions[id]?.trim()
    if (!resolution) { setMsg({ type: 'err', text: 'La résolution est obligatoire.' }); return }
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/litiges/${id}/resoudre`, { resolution })
      setMsg({ type: 'ok', text: 'Litige résolu ✓' })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  async function rejeter(id: string) {
    const motifRejet = motifs[id]?.trim()
    if (!motifRejet) { setMsg({ type: 'err', text: 'Le motif de rejet est obligatoire.' }); return }
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/litiges/${id}/rejeter`, { motifRejet })
      setMsg({ type: 'ok', text: 'Litige rejeté.' })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: msg.type === 'ok' ? 'rgba(10,124,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'ok' ? 'var(--primary)' : 'var(--danger)' }}>
          {msg.text}
        </div>
      )}

      {litiges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <Scale size={40} className="mb-3 opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="font-medium" style={{ color: 'var(--muted)' }}>Aucun litige en cours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {litiges.map((l) => {
            const s = STATUT_STYLE[l.statut] ?? { bg: '#F3F4F6', color: '#6B7280' }
            return (
              <div key={l.id} className="rounded-2xl p-5 space-y-3" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--foreground)' }}>{l.sujet}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                      {l.auteur?.nom} · {l.auteur?.telephone} · {new Date(l.creeLe).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                    {l.statut}
                  </span>
                </div>

                <p className="text-sm p-3 rounded-xl" style={{ background: '#F9FAFB', color: 'var(--foreground)' }}>
                  {l.description}
                </p>

                {/* Actions selon statut */}
                {l.statut === 'OUVERT' && (
                  <button onClick={() => examiner(l.id)} disabled={loadingId === l.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'var(--info)' }}>
                    <Eye size={14} /> Prendre en charge
                  </button>
                )}

                {l.statut === 'EN_COURS' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <textarea placeholder="Résolution (obligatoire)..."
                        value={resolutions[l.id] ?? ''}
                        onChange={e => setResolutions(p => ({ ...p, [l.id]: e.target.value }))}
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
                        style={{ background: '#F9FAFB', border: '1px solid var(--border)' }} />
                      <button onClick={() => resoudre(l.id)} disabled={loadingId === l.id}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold text-white self-start disabled:opacity-50"
                        style={{ background: 'var(--primary)' }}>
                        <CheckCircle size={14} /> Résoudre
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Motif de rejet..."
                        value={motifs[l.id] ?? ''}
                        onChange={e => setMotifs(p => ({ ...p, [l.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: '#F9FAFB', border: '1px solid var(--border)' }} />
                      <button onClick={() => rejeter(l.id)} disabled={loadingId === l.id}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--danger)' }}>
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
