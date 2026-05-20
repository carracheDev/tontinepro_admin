'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { MapPin, Users, Star, TrendingUp } from 'lucide-react'
import KpiCard from '@/components/dashboard/kpi-card'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Zone = {
  zone: string; ville: string; nbClients: number
  scoreMoyen: number; eligiblesPADME: number
}

function scoreColor(s: number) {
  if (s >= 75) return '#16A34A'
  if (s >= 60) return '#1A56DB'
  if (s >= 40) return '#D97706'
  return '#DC2626'
}

export default function ZonesPage() {
  const { data } = useSWR('/analytics/scores-par-zone', fetcher, { refreshInterval: 120_000 })
  const zones: Zone[] = Array.isArray(data) ? data : []

  const totalClients = zones.reduce((s, z) => s + z.nbClients, 0)
  const totalEligibles = zones.reduce((s, z) => s + z.eligiblesPADME, 0)
  const scoreMoyenGlobal = zones.length > 0
    ? Math.round(zones.reduce((s, z) => s + z.scoreMoyen, 0) / zones.length) : 0
  const meilleurZone = zones.reduce((best, z) => z.scoreMoyen > (best?.scoreMoyen ?? 0) ? z : best, zones[0])

  const sortedByClients = [...zones].sort((a, b) => b.nbClients - a.nbClients)
  const sortedByScore   = [...zones].sort((a, b) => b.scoreMoyen - a.scoreMoyen)

  return (
    <div className="space-y-6 max-w-350">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titre="Zones actives" valeur={zones.length} icone={MapPin} couleur="var(--primary)" />
        <KpiCard titre="Total clients" valeur={totalClients} icone={Users} couleur="var(--info)" />
        <KpiCard titre="Score moyen global" valeur={`${scoreMoyenGlobal}/100`} icone={Star} couleur="var(--warning)" />
        <KpiCard titre="Éligibles PADME" valeur={totalEligibles} icone={TrendingUp} couleur="var(--primary)" />
      </div>

      {/* Meilleure zone */}
      {meilleurZone && (
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'var(--primary-light)', border: '1px solid #BBF7D0' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(22,163,74,0.15)' }}>🏆</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
              Meilleure zone
            </p>
            <p className="font-black text-lg" style={{ color: 'var(--primary)' }}>
              {meilleurZone.zone} — {meilleurZone.ville}
            </p>
            <p className="text-sm" style={{ color: 'var(--primary)', opacity: 0.8 }}>
              Score moyen : {meilleurZone.scoreMoyen}/100 · {meilleurZone.nbClients} clients · {meilleurZone.eligiblesPADME} éligibles PADME
            </p>
          </div>
        </div>
      )}

      {/* Charts côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clients par zone */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Clients par zone
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sortedByClients} barSize={18} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [v, 'Clients']} />
              <Bar dataKey="nbClients" name="Clients" radius={[4, 4, 0, 0]}>
                {sortedByClients.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#16A34A' : '#BBF7D0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score moyen par zone */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Score moyen par zone
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sortedByScore} barSize={18} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [`${v}/100`, 'Score moyen']} />
              <Bar dataKey="scoreMoyen" name="Score moyen" radius={[4, 4, 0, 0]}>
                {sortedByScore.map((z, i) => (
                  <Cell key={i} fill={scoreColor(z.scoreMoyen)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table détaillée */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Détail par zone</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['Zone', 'Ville', 'Clients', 'Score moyen', 'Éligibles PADME', 'Couverture PADME'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedByClients.map((z, i) => {
                const couverture = z.nbClients > 0 ? Math.round(z.eligiblesPADME / z.nbClients * 100) : 0
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{z.zone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted)' }}>{z.ville}</td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: 'var(--foreground)' }}>{z.nbClients}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                          <div className="h-full rounded-full" style={{ width: `${z.scoreMoyen}%`, background: scoreColor(z.scoreMoyen) }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: scoreColor(z.scoreMoyen) }}>
                          {z.scoreMoyen}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: 'var(--primary)' }}>{z.eligiblesPADME}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: couverture >= 30 ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)', color: couverture >= 30 ? '#16A34A' : '#D97706' }}>
                        {couverture}%
                      </span>
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
