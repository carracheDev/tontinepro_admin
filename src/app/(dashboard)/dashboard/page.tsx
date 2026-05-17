'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import KpiCard from '@/components/dashboard/kpi-card'
import {
  Users, Coins, ArrowDownToLine, CreditCard,
  Banknote, TrendingUp, BarChart2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K FCFA`
  return `${n} FCFA`
}

export default function DashboardPage() {
  const { data: kpis } = useSWR('/analytics/kpis', fetcher, { refreshInterval: 60_000 })
  const { data: revenus } = useSWR('/analytics/evolution-revenus', fetcher)
  const { data: retraitsData } = useSWR('/retraits/en-attente', fetcher)

  const nbRetraits = Array.isArray(retraitsData) ? retraitsData.length : 0

  const cards = [
    { titre: 'Clients actifs',       valeur: kpis?.totalClients ?? '—',          icone: Users,          couleur: 'var(--primary)' },
    { titre: 'Collecteurs actifs',   valeur: kpis?.totalCollecteurs ?? '—',       icone: Users,          couleur: 'var(--info)' },
    { titre: 'Volume total cotisé',  valeur: kpis?.volumeTotal != null ? fmt(kpis.volumeTotal) : '—', icone: TrendingUp, couleur: 'var(--primary)' },
    { titre: 'Revenus commissions',  valeur: kpis?.revenusCommissions != null ? fmt(kpis.revenusCommissions) : '—', icone: Banknote, couleur: 'var(--primary-vif)' },
    { titre: 'Revenus micro-crédits',valeur: kpis?.revenusMicroCredits != null ? fmt(kpis.revenusMicroCredits) : '—', icone: CreditCard, couleur: 'var(--info)' },
    { titre: 'Revenus total',        valeur: kpis?.revenusTotal != null ? fmt(kpis.revenusTotal) : '—',    icone: BarChart2,  couleur: 'var(--primary)' },
    { titre: 'Éligibles PADME',      valeur: kpis?.clientsEligiblesPADME ?? '—', icone: Coins,          couleur: '#7C3AED' },
    {
      titre: 'Retraits en attente',
      valeur: nbRetraits,
      icone: ArrowDownToLine,
      couleur: nbRetraits > 0 ? 'var(--warning)' : 'var(--primary)',
      badge: nbRetraits > 0 ? `${nbRetraits} urgent${nbRetraits > 1 ? 's' : ''}` : undefined,
      badgeCouleur: 'var(--warning)',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Alerte retraits */}
      {nbRetraits > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', color: 'var(--warning)' }}>
          <ArrowDownToLine size={16} />
          <span>{nbRetraits} retrait{nbRetraits > 1 ? 's' : ''} en attente de validation admin (≥ 50 000 FCFA)</span>
          <a href="/retraits" className="ml-auto underline font-bold">Voir →</a>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => <KpiCard key={c.titre} {...c} />)}
      </div>

      {/* Graphique Évolution revenus 6 mois */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--foreground)' }}>
          Évolution des revenus — 6 derniers mois
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenus ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
              formatter={(v) => [fmt(Number(v))]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="commissions" name="Commissions" fill="var(--primary)" radius={[3,3,0,0]} stackId="a" />
            <Bar dataKey="revenusMicroCredits" name="Micro-crédits" fill="var(--info)" radius={[3,3,0,0]} stackId="a" />
            <Bar dataKey="abonnements" name="Abonnements" fill="var(--primary-vif)" radius={[3,3,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats taux */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Taux remboursement</p>
            <p className="text-2xl font-black mt-1" style={{ color: 'var(--primary)' }}>{kpis.tauxRemboursement}%</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Taux commission</p>
            <p className="text-2xl font-black mt-1" style={{ color: 'var(--foreground)' }}>{kpis.tauxCommission}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Éligibles micro-crédit</p>
            <p className="text-2xl font-black mt-1" style={{ color: 'var(--info)' }}>{kpis.clientsEligiblesMicroCredit}</p>
          </div>
        </div>
      )}
    </div>
  )
}
