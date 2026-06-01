'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { Banknote, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

export default function CommissionsPage() {
  const { data: revenus, isLoading } = useSWR('/analytics/evolution-revenus', fetcher)
  const { data: perf } = useSWR('/analytics/performance-collecteurs', fetcher)
  const { data: kpis } = useSWR('/analytics/kpis', fetcher)

  const donnees = Array.isArray(revenus) ? revenus : []
  const collecteurs = Array.isArray(perf) ? perf : []

  const totalCommissions = donnees.reduce((s: number, d: { commissions: number }) => s + d.commissions, 0)

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(10,124,74,0.1)' }}>
            <Banknote size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
            {kpis?.revenusCommissions != null ? `${(kpis.revenusCommissions / 1000).toFixed(0)}K FCFA` : '—'}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Commissions totales versées</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary-vif)' }} />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>
            {(totalCommissions / 1000).toFixed(0)}K FCFA
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>6 derniers mois</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>
            {kpis?.tauxCommission ?? '—'}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Taux commission cotisation</p>
        </div>
      </div>

      {/* Graphique 6 mois */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--foreground)' }}>
          Évolution commissions — 6 derniers mois
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-12" style={{ color: 'var(--muted)' }}>Chargement...</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={donnees}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} FCFA`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="commissions" name="Cotisations" fill="var(--primary)" radius={[3,3,0,0]} />
              <Bar dataKey="padme" name="PADME" fill="var(--primary-vif)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top collecteurs par commissions */}
      {collecteurs.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>Top collecteurs par commissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Collecteur', 'Clients', 'Commissions gagnées'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...collecteurs]
                  .sort((a: { totalCommissions: number }, b: { totalCommissions: number }) => b.totalCommissions - a.totalCommissions)
                  .slice(0, 10)
                  .map((c: { id: string; nom: string; telephone: string; nbClients: number; totalCommissions: number }, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-sm" style={{ color: i < 3 ? 'var(--warning)' : 'var(--muted)' }}>
                        #{i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.telephone}</p>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>{c.nbClients}</td>
                      <td className="px-6 py-4 font-black text-sm" style={{ color: 'var(--primary)' }}>
                        {c.totalCommissions.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
