'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import { Search, UserX, UserCheck, Users, ShieldCheck, Shield, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Utilisateur = {
  id: string; nom: string; telephone: string; role: string
  statut: string; creeLe: string; kycVerifie?: boolean
  scoreCredit?: { score: number }
}

const ROLE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  CLIENT:      { label: 'Client',      color: '#2563EB', bg: 'rgba(22,163,74,0.1)'    },
  AGENT:       { label: 'Agent',       color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'   },
  INDEPENDANT: { label: 'Indép.',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'   },
  SUPERVISEUR: { label: 'Superviseur', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'   },
  ADMIN:       { label: 'Admin',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)'    },
}

function scoreColor(s: number) {
  if (s >= 75) return '#2563EB'
  if (s >= 60) return '#3B82F6'
  if (s >= 40) return '#F59E0B'
  return '#EF4444'
}

export default function UtilisateursPage() {
  const router = useRouter()
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const params = new URLSearchParams({ limite: '50' })
  if (filtreRole) params.set('role', filtreRole)
  if (recherche)  params.set('recherche', recherche)

  const { data, mutate } = useSWR(`/utilisateurs?${params}`, fetcher)

  const utilisateurs: Utilisateur[] = data?.utilisateurs ?? []
  const total: number = data?.total ?? 0

  async function toggleStatut(e: React.MouseEvent, u: Utilisateur) {
    e.stopPropagation()  // empêche la navigation vers la fiche
    setLoadingId(u.id)
    setMsg(null)
    try {
      await api.put(`/utilisateurs/${u.id}/statut`, {
        statut: u.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF',
      })
      setMsg({ type: 'ok', text: `Compte ${u.statut === 'ACTIF' ? 'suspendu' : 'réactivé'} ✓` })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-5 max-w-350">

      {/* ── Filtres ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou téléphone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-shadow focus:shadow-md"
            style={{ background: '#fff', border: '1px solid var(--border)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { v: '',           l: 'Tous' },
            { v: 'CLIENT',     l: 'Clients' },
            { v: 'AGENT',      l: 'Agents' },
            { v: 'INDEPENDANT',l: 'Indép.' },
            { v: 'SUPERVISEUR',l: 'Superviseurs' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setFiltreRole(v)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filtreRole === v ? '#2563EB' : '#fff',
                color: filtreRole === v ? '#fff' : 'var(--muted)',
                border: `1px solid ${filtreRole === v ? '#2563EB' : 'var(--border)'}`,
                boxShadow: filtreRole === v ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message ──────────────────────────────────────────────────────────── */}
      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: msg.type === 'ok' ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
            color: msg.type === 'ok' ? '#2563EB' : '#EF4444',
            border: `1px solid ${msg.type === 'ok' ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          {msg.text}
        </div>
      )}

      {/* ── Info cliquabilité ─────────────────────────────────────────────────── */}
      <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
        <ChevronRight size={12} />
        Cliquez sur une ligne pour accéder à la fiche complète du client
      </p>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)' }}>

        {/* Compteur */}
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(22,163,74,0.1)' }}>
            <Users size={16} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              {total} utilisateur{total > 1 ? 's' : ''}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {filtreRole || recherche ? 'Résultats filtrés' : 'Tous les comptes'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Téléphone', 'Rôle', 'Statut', 'Score', 'KYC', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => {
                const rs    = ROLE_STYLE[u.role] ?? { label: u.role, color: '#6B7280', bg: '#F3F4F6' }
                const score = u.scoreCredit?.score

                return (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/utilisateurs/${u.id}`)}
                    className="transition-colors cursor-pointer group"
                    style={{ borderBottom: '1px solid #E2E8F0' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Nom + avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, #2563EB, #1E3A8A)` }}
                        >
                          {u.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{u.nom}</p>
                        </div>
                      </div>
                    </td>

                    {/* Téléphone */}
                    <td className="px-5 py-3.5 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                      {u.telephone}
                    </td>

                    {/* Rôle */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: rs.bg, color: rs.color }}>
                        {rs.label}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full"
                          style={{ background: u.statut === 'ACTIF' ? '#2563EB' : '#EF4444' }} />
                        <span className="text-xs font-semibold"
                          style={{ color: u.statut === 'ACTIF' ? '#2563EB' : '#EF4444' }}>
                          {u.statut}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-3.5">
                      {score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${score}%`, background: scoreColor(score) }} />
                          </div>
                          <span className="text-xs font-black" style={{ color: scoreColor(score) }}>{score}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>

                    {/* KYC */}
                    <td className="px-5 py-3.5">
                      {u.kycVerifie ? (
                        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#2563EB' }}>
                          <ShieldCheck size={14} /> Vérifié
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                          <Shield size={14} /> Non vérifié
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(u.creeLe).toLocaleDateString('fr-FR')}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleStatut(e, u)}
                          disabled={loadingId === u.id || u.role === 'ADMIN'}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                          style={{
                            background: u.statut === 'ACTIF' ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
                            color: u.statut === 'ACTIF' ? '#EF4444' : '#2563EB',
                            border: `1px solid ${u.statut === 'ACTIF' ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`,
                          }}
                        >
                          {u.statut === 'ACTIF' ? <UserX size={13} /> : <UserCheck size={13} />}
                          {u.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                        </button>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: '#2563EB' }} />
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
