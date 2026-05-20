'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts'
import { UserCheck, Coins, TrendingUp, Users, Star } from 'lucide-react'
import KpiCard from '@/components/dashboard/kpi-card'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)
import { api } from '@/lib/api'

type Collecteur = {
  id: string
  nom: string
  telephone: string
  typeCollecteur?: string
  nbClients: number
  volumeCollecte: number
  totalCommissions: number
  scoreMoyenClients: number
  tauxRegularite: number
  zone?: string
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

function scoreColor(s: number) {
  if (s >= 75) return '#16A34A'
  if (s >= 60) return '#1A56DB'
  if (s >= 40) return '#D97706'
  return '#DC2626'
}

function MedalBadge({ rang }: { rang: number }) {
  const medals = ['🥇', '🥈', '🥉']
  if (rang <= 3) return <span className="text-xl">{medals[rang - 1]}</span>
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
      style={{ background: '#F3F4F6', color: 'var(--muted)' }}>{rang}</span>
  )
}

export default function CollecteursPage() {
  const { data: perfData } = useSWR('/analytics/performance-collecteurs', fetcher, { refreshInterval: 120_000 })
  const { data: dashData } = useSWR('/analytics/dashboard', fetcher, { refreshInterval: 120_000 })

  const collecteurs: Collecteur[] = Array.isArray(perfData) ? perfData : perfData?.collecteurs ?? []
  const topCollecteurs = dashData?.topCollecteurs ?? []

  const totalClients = collecteurs.reduce((s, c) => s + (c.nbClients ?? 0), 0)
  const totalVolume = collecteurs.reduce((s, c) => s + (c.volumeCollecte ?? 0), 0)
  const totalCommissions = collecteurs.reduce((s, c) => s + (c.totalCommissions ?? 0), 0)
  const scoreMoyen = collecteurs.length > 0
    ? Math.round(collecteurs.reduce((s, c) => s + (c.scoreMoyenClients ?? 0), 0) / collecteurs.length)
    : 0

  // Pour le BarChart — top 10 par volume
  const top10 = [...collecteurs]
    .sort((a, b) => (b.volumeCollecte ?? 0) - (a.volumeCollecte ?? 0))
    .slice(0, 10)

  return (
    <div className="space-y-6 max-w-350">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titre="Collecteurs actifs" valeur={collecteurs.length} icone={UserCheck} couleur="var(--primary)" />
        <KpiCard titre="Total clients" valeur={totalClients} icone={Users} couleur="var(--info)" />
        <KpiCard titre="Volume collecté" valeur={`${fmt(totalVolume)} FCFA`} icone={TrendingUp} couleur="var(--primary)" />
        <KpiCard titre="Commissions versées" valeur={`${fmt(totalCommissions)} FCFA`} icone={Coins} couleur="var(--warning)" />
      </div>

      {/* BarChart volume + podium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* BarChart top 10 */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Volume collecté — Top 10</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>FCFA</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10} barSize={16} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={v => v?.split(' ')[0] ?? v} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                formatter={(v, n) => [`${fmt(Number(v))} FCFA`, n === 'volumeCollecte' ? 'Volume' : 'Commissions']} />
              <Bar dataKey="volumeCollecte" name="Volume collecté" radius={[4, 4, 0, 0]}>
                {top10.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#16A34A' : i <= 2 ? '#86EFAC' : '#D1FAE5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Podium rapide */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Podium commissions
          </h3>
          <div className="space-y-3">
            {(topCollecteurs.length > 0 ? topCollecteurs : top10.slice(0, 5)).map((c: Collecteur, i: number) => (
              <div key={c.id ?? i} className="flex items-center gap-3">
                <MedalBadge rang={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {c.nbClients} clients
                  </p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(c.totalCommissions)} F
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table complète */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            Tous les collecteurs — {collecteurs.length}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['Rang', 'Collecteur', 'Clients', 'Volume collecté', 'Commissions', 'Score moy. clients', 'Régularité'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...collecteurs]
                .sort((a, b) => (b.volumeCollecte ?? 0) - (a.volumeCollecte ?? 0))
                .map((c, i) => (
                  <tr key={c.id ?? i} style={{ borderBottom: '1px solid #F3F4F6' }}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5"><MedalBadge rang={i + 1} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {c.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: 'var(--foreground)' }}>{c.nbClients ?? 0}</td>
                    <td className="px-5 py-3.5 font-black text-sm" style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(c.volumeCollecte ?? 0)} FCFA
                    </td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(c.totalCommissions ?? 0)} FCFA
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                          <div className="h-full rounded-full" style={{ width: `${c.scoreMoyenClients ?? 0}%`, background: scoreColor(c.scoreMoyenClients ?? 0) }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: scoreColor(c.scoreMoyenClients ?? 0) }}>
                          {c.scoreMoyenClients ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: (c.tauxRegularite ?? 0) >= 0.8 ? '#16A34A' : '#D97706' }}>
                        {Math.round((c.tauxRegularite ?? 0) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
