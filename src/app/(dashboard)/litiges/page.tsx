'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import { api, extraireErreur } from '@/lib/api'
import { Scale, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Litige = {
  id: string
  motif: string
  statut: string
  categorie: string
  creeLe: string
  client?: { nom: string; telephone: string }
  transaction?: { montantFcfa: number; type: string } | null
}

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  OUVERT:    { bg: 'rgba(220,38,38,0.1)',  color: 'var(--danger)',  label: 'Ouvert'    },
  EN_EXAMEN: { bg: 'rgba(217,119,6,0.1)',  color: 'var(--warning)', label: 'En examen' },
  RESOLU:    { bg: 'rgba(37,99,235,0.1)',  color: 'var(--primary)', label: 'Résolu'    },
  REJETE:    { bg: 'rgba(107,114,128,0.1)',color: 'var(--muted)',   label: 'Rejeté'    },
}

const CATEGORIE_LABEL: Record<string, string> = {
  TRANSACTION: 'Transaction',
  COLLECTEUR:  'Collecteur',
  AUTRE:       'Autre',
}

const FILTRES = [
  { cle: '',          label: 'Tous'      },
  { cle: 'OUVERT',    label: 'Ouverts'   },
  { cle: 'EN_EXAMEN', label: 'En examen' },
  { cle: 'RESOLU',    label: 'Résolus'   },
  { cle: 'REJETE',    label: 'Rejetés'   },
]

export default function LitigesPage() {
  const [filtre, setFiltre] = useState('')
  const url = '/litiges/liste' + (filtre ? `?statut=${filtre}` : '')
  const { data, mutate } = useSWR(url, fetcher)
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
      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {FILTRES.map(f => {
          const actif = filtre === f.cle
          return (
            <button key={f.cle} onClick={() => setFiltre(f.cle)}
              className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: actif ? 'var(--primary)' : '#fff',
                color: actif ? '#fff' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}>
              {f.label}
            </button>
          )
        })}
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: msg.type === 'ok' ? 'rgba(37,99,235,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'ok' ? 'var(--primary)' : 'var(--danger)' }}>
          {msg.text}
        </div>
      )}

      {litiges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <Scale size={40} className="mb-3 opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="font-medium" style={{ color: 'var(--muted)' }}>Aucun litige</p>
        </div>
      ) : (
        <div className="space-y-3">
          {litiges.map((l) => {
            const s = STATUT_STYLE[l.statut] ?? { bg: '#F3F4F6', color: '#6B7280', label: l.statut }
            return (
              <div key={l.id} className="rounded-2xl p-5 space-y-3" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: 'var(--foreground)' }}>
                        {CATEGORIE_LABEL[l.categorie] ?? l.categorie}
                      </span>
                      {l.transaction && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          · {l.transaction.type} {l.transaction.montantFcfa?.toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                    </div>
                    <p className="font-bold mt-1.5" style={{ color: 'var(--foreground)' }}>
                      {l.client?.nom ?? 'Client inconnu'}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                      {l.client?.telephone} · {new Date(l.creeLe).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>

                <p className="text-sm p-3 rounded-xl" style={{ background: '#F8FAFC', color: 'var(--foreground)' }}>
                  {l.motif}
                </p>

                <Link href={`/litiges/${l.id}`} className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  Ouvrir le dossier complet <ArrowRight size={14} />
                </Link>

                {/* Actions selon statut */}
                {l.statut === 'OUVERT' && (
                  <button onClick={() => examiner(l.id)} disabled={loadingId === l.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'var(--info)' }}>
                    <Eye size={14} /> Prendre en charge
                  </button>
                )}

                {l.statut === 'EN_EXAMEN' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <textarea placeholder="Résolution (obligatoire)..."
                        value={resolutions[l.id] ?? ''}
                        onChange={e => setResolutions(p => ({ ...p, [l.id]: e.target.value }))}
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
                        style={{ background: '#fff', border: '1px solid var(--border)' }} />
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
                        style={{ background: '#fff', border: '1px solid var(--border)' }} />
                      <button onClick={() => rejeter(l.id)} disabled={loadingId === l.id}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--danger)' }}>
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  </div>
                )}

                {/* Résolution affichée pour les litiges clôturés */}
                {(l.statut === 'RESOLU' || l.statut === 'REJETE') && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {l.statut === 'RESOLU' ? '✅ Résolu' : '❌ Rejeté'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
