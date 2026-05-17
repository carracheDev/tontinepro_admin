'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { CreditCard, CheckCircle, XCircle } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type MicroCredit = {
  id: string; montantPrincipalFcfa: number; statut: string; creeLe: string
  tauxInteret: number; dureeEnMois: number
  client: { nom: string; telephone: string }
}

const STATUT: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE:   { label: 'En attente',   bg: 'rgba(217,119,6,0.1)',  color: 'var(--warning)' },
  APPROUVE:     { label: 'Approuvé',     bg: 'rgba(10,124,74,0.1)',  color: 'var(--primary)' },
  REFUSE:       { label: 'Refusé',       bg: 'rgba(220,38,38,0.1)',  color: 'var(--danger)'  },
  EN_COURS:     { label: 'En cours',     bg: 'rgba(2,132,199,0.1)',  color: 'var(--info)'    },
  TERMINE:      { label: 'Terminé',      bg: 'rgba(107,114,128,0.1)',color: 'var(--muted)'   },
  CONSENTEMENT: { label: 'Consentement', bg: 'rgba(217,119,6,0.1)', color: 'var(--warning)' },
}

export default function MicroCreditsPage() {
  const { data, mutate } = useSWR('/micro-credits/en-attente', fetcher)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [motifs, setMotifs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const credits: MicroCredit[] = Array.isArray(data) ? data : (data?.credits ?? [])

  async function valider(id: string) {
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/micro-credits/${id}/valider`)
      setMsg({ type: 'ok', text: 'Micro-crédit approuvé ✓' })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally { setLoadingId(null) }
  }

  async function refuser(id: string) {
    const motif = motifs[id]?.trim()
    if (!motif) { setMsg({ type: 'err', text: 'Le motif de refus est obligatoire.' }); return }
    setLoadingId(id)
    setMsg(null)
    try {
      await api.put(`/micro-credits/${id}/refuser`, { motif })
      setMsg({ type: 'ok', text: 'Micro-crédit refusé.' })
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

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <CreditCard size={18} style={{ color: 'var(--info)' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            Micro-crédits en attente
            {credits.length > 0 && (
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--warning)' }}>
                {credits.length}
              </span>
            )}
          </h2>
        </div>

        {credits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
            <CheckCircle size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Aucun micro-crédit en attente</p>
          </div>
        ) : (
          <div>
            {credits.map((c) => {
              const s = STATUT[c.statut] ?? { label: c.statut, bg: '#F3F4F6', color: '#6B7280' }
              return (
                <div key={c.id} className="px-6 py-5 border-b" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--foreground)' }}>{c.client?.nom}</p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{c.client?.telephone}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                        Taux {(c.tauxInteret * 100).toFixed(0)}% · {c.dureeEnMois} mois ·{' '}
                        {new Date(c.creeLe).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: 'var(--info)', fontFamily: 'monospace' }}>
                        {c.montantPrincipalFcfa.toLocaleString('fr-FR')} FCFA
                      </p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                  {c.statut === 'EN_ATTENTE' && (
                    <div className="flex items-center gap-2">
                      <input placeholder="Motif de refus (obligatoire si refus)..."
                        value={motifs[c.id] ?? ''}
                        onChange={e => setMotifs(p => ({ ...p, [c.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: '#F9FAFB', border: '1px solid var(--border)' }} />
                      <button onClick={() => valider(c.id)} disabled={loadingId === c.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--primary)' }}>
                        <CheckCircle size={15} /> Approuver
                      </button>
                      <button onClick={() => refuser(c.id)} disabled={loadingId === c.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--danger)' }}>
                        <XCircle size={15} /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
