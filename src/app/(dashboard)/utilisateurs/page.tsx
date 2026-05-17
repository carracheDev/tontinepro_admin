'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import { Search, UserX, UserCheck, Users } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Utilisateur = {
  id: string; nom: string; telephone: string; role: string
  statut: string; creeLe: string; scoreCredit?: { score: number }
}

const ROLE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  CLIENT:      { label: 'Client',      color: 'var(--primary)',  bg: 'rgba(10,124,74,0.1)' },
  AGENT:       { label: 'Agent',       color: 'var(--info)',     bg: 'rgba(2,132,199,0.1)' },
  INDEPENDANT: { label: 'Indépendant', color: 'var(--warning)',  bg: 'rgba(217,119,6,0.1)' },
  SUPERVISEUR: { label: 'Superviseur', color: '#7C3AED',         bg: 'rgba(124,58,237,0.1)' },
  ADMIN:       { label: 'Admin',       color: 'var(--danger)',   bg: 'rgba(220,38,38,0.1)' },
}

export default function UtilisateursPage() {
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const params = new URLSearchParams({ limite: '50' })
  if (filtreRole) params.set('role', filtreRole)
  if (recherche) params.set('recherche', recherche)

  const { data, mutate } = useSWR(`/utilisateurs?${params}`, fetcher)

  const utilisateurs: Utilisateur[] = data?.utilisateurs ?? []
  const total: number = data?.total ?? 0

  async function toggleStatut(u: Utilisateur) {
    setLoadingId(u.id)
    setMsg(null)
    try {
      const estActif = u.statut === 'ACTIF'
      await api.put(`/utilisateurs/${u.id}/statut`, {
        statut: estActif ? 'SUSPENDU' : 'ACTIF',
        motif: estActif ? 'Suspension administrative' : undefined,
      })
      setMsg({ type: 'ok', text: `Compte ${estActif ? 'suspendu' : 'réactivé'} ✓` })
      mutate()
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Nom ou téléphone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#fff', border: '1px solid var(--border)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ v: '', l: 'Tous' }, { v: 'CLIENT', l: 'Clients' }, { v: 'AGENT', l: 'Agents' }, { v: 'INDEPENDANT', l: 'Indép.' }, { v: 'SUPERVISEUR', l: 'Superviseurs' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFiltreRole(v)}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: filtreRole === v ? 'var(--primary)' : '#fff', color: filtreRole === v ? '#fff' : 'var(--muted)', border: `1px solid ${filtreRole === v ? 'var(--primary)' : 'var(--border)'}` }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: msg.type === 'ok' ? 'rgba(10,124,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'ok' ? 'var(--primary)' : 'var(--danger)' }}>
          {msg.text}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Users size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            {total} utilisateur{total > 1 ? 's' : ''}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['Nom', 'Téléphone', 'Rôle', 'Statut', 'Score', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => {
                const rs = ROLE_STYLE[u.role] ?? { label: u.role, color: '#6B7280', bg: '#F3F4F6' }
                const score = u.scoreCredit?.score
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {u.nom?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>{u.telephone}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rs.bg, color: rs.color }}>{rs.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: u.statut === 'ACTIF' ? 'rgba(10,124,74,0.1)' : 'rgba(220,38,38,0.1)', color: u.statut === 'ACTIF' ? 'var(--primary)' : 'var(--danger)' }}>
                        {u.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 70 ? 'var(--primary)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{score}</span>
                        </div>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                      {new Date(u.creeLe).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatut(u)}
                        disabled={loadingId === u.id || u.role === 'ADMIN'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: u.statut === 'ACTIF' ? 'rgba(220,38,38,0.1)' : 'rgba(10,124,74,0.1)', color: u.statut === 'ACTIF' ? 'var(--danger)' : 'var(--primary)' }}>
                        {u.statut === 'ACTIF' ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                      </button>
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
