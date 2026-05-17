'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { Coins, TrendingUp, Users, Banknote } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type PerfCollecteur = {
  id: string; nom: string; telephone: string
  nbClients: number; totalCotisations: number; totalCommissions: number; tauxRegularite: number
}

export default function TontinesPage() {
  const { data: kpis } = useSWR('/analytics/kpis', fetcher)
  const { data: perf, isLoading } = useSWR('/analytics/performance-collecteurs', fetcher)

  const collecteurs: PerfCollecteur[] = perf ?? []

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return `${n}`
  }

  return (
    <div className="space-y-6">

      {/* KPIs tontines */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { titre: 'Volume total cotisé', valeur: kpis?.volumeTotal != null ? `${fmt(kpis.volumeTotal)} FCFA` : '—', icone: TrendingUp, couleur: 'var(--primary)' },
          { titre: 'Collecteurs actifs',  valeur: kpis?.totalCollecteurs ?? '—', icone: Users,      couleur: 'var(--info)' },
          { titre: 'Clients actifs',      valeur: kpis?.totalClients ?? '—',     icone: Coins,      couleur: 'var(--primary-vif)' },
        ].map(({ titre, valeur, icone: Icon, couleur }) => (
          <div key={titre} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${couleur}18` }}>
              <Icon size={20} style={{ color: couleur }} />
            </div>
            <p className="text-2xl font-black" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{valeur}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{titre}</p>
          </div>
        ))}
      </div>

      {/* Performance collecteurs */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Banknote size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            Performance collecteurs ({collecteurs.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12" style={{ color: 'var(--muted)' }}>Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  {['Collecteur', 'Clients', 'Cotisations collectées', 'Commissions gagnées', 'Taux régularité'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collecteurs.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {c.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: 'var(--foreground)' }}>{c.nbClients}</td>
                    <td className="px-6 py-4 font-black text-sm" style={{ color: 'var(--primary)' }}>
                      {c.totalCotisations.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4 font-black text-sm" style={{ color: 'var(--primary-vif)' }}>
                      {c.totalCommissions.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.tauxRegularite}%`, background: c.tauxRegularite >= 80 ? 'var(--primary)' : c.tauxRegularite >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{c.tauxRegularite}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
