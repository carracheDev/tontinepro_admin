'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { Banknote, TrendingUp, Wallet } from 'lucide-react'
import { COLORS } from '@/lib/colors'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

function fmtFcfa(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K FCFA`
  return `${n} FCFA`
}

export default function CommissionsPage() {
  const { data: revenus, isLoading } = useSWR('/analytics/evolution-revenus', fetcher)
  const { data: perf } = useSWR('/analytics/performance-collecteurs', fetcher)
  const { data: kpis } = useSWR('/analytics/kpis', fetcher)

  const donnees = Array.isArray(revenus) ? revenus : []
  const collecteurs = Array.isArray(perf) ? perf : []

  const total6Mois = donnees.reduce((s: number, d: { total: number }) => s + (d.total ?? 0), 0)

  return (
    <div className="space-y-6 max-w-350">
      {/* Revenus réels de la plateforme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            titre: 'Revenus totaux',
            sous: 'Frais de retrait + intérêts encaissés',
            valeur: kpis?.revenusTotal ?? 0,
            icone: Banknote,
            couleur: COLORS.primary,
          },
          {
            titre: 'Frais de retrait',
            sous: 'Barème progressif · 100 % plateforme',
            valeur: kpis?.revenusRetraits ?? 0,
            icone: Wallet,
            couleur: COLORS.info,
          },
          {
            titre: 'Intérêts micro-crédit',
            sous: `Taux ${kpis?.tauxInteret ?? '10%'} sur crédits décaissés`,
            valeur: kpis?.revenusMicroCredits ?? 0,
            icone: TrendingUp,
            couleur: COLORS.warning,
          },
        ].map(({ titre, sous, valeur, icone: Icon, couleur }) => (
          <div
            key={titre}
            className="rounded-2xl p-6 transition-all"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${couleur}15`,
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${couleur}18`
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}35`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)'
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}15`
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${couleur}12` }}>
                <Icon size={22} style={{ color: couleur }} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-4xl font-black leading-none mb-2" style={{ color: couleur, fontVariantNumeric: 'tabular-nums' }}>
              {typeof valeur === 'number' ? fmtFcfa(valeur) : valeur}
            </p>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
              {titre}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3B8' }}>
              {sous}
            </p>
          </div>
        ))}
      </div>

      {/* Graphique 6 mois */}
      <div
        className="rounded-2xl p-6 transition-all"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-black text-base" style={{ color: '#0F172A' }}>
              Évolution des revenus
            </h3>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>
              6 derniers mois · {fmtFcfa(total6Mois)} encaissés
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-sm" style={{ color: '#9CA3B8' }}>Chargement...</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={donnees} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gPadme" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '10px 14px' }}
                formatter={(v) => [fmtFcfa(Number(v)), '']}
                cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="fraisRetraits" stackId="r" name="Frais de retrait" fill="url(#gComm)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="interetsMicroCredit" stackId="r" name="Intérêts micro-crédit" fill="url(#gPadme)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Barème officiel — d'où vient le revenu */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}
      >
        <h3 className="font-black text-base mb-1" style={{ color: '#0F172A' }}>
          Barème des frais de retrait
        </h3>
        <p className="text-sm mb-5" style={{ color: '#9CA3B8' }}>
          Montants fixes par tranche · urgence = frais × 2 · 100 % plateforme · cotisation gratuite (0 %)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#64748B' }}>
                <th className="text-left font-bold py-2">Montant retiré</th>
                <th className="text-right font-bold py-2">TontineBénin</th>
                <th className="text-right font-bold py-2">MTN / Moov</th>
                <th className="text-right font-bold py-2">Économie</th>
              </tr>
            </thead>
            <tbody style={{ color: '#0F172A' }}>
              {[
                ['≤ 5 000 FCFA', '100 F', '125 F', '25 F'],
                ['≤ 10 000 FCFA', '200 F', '225 F', '25 F'],
                ['≤ 20 000 FCFA', '350 F', '375 F', '25 F'],
                ['≤ 50 000 FCFA', '650 F', '700 F', '50 F'],
                ['≤ 100 000 FCFA', '900 F', '1 000 F', '100 F'],
                ['≤ 200 000 FCFA', '1 800 F', '2 000 F', '200 F'],
              ].map(([m, nous, mtn, eco]) => (
                <tr key={m} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td className="py-2.5 font-semibold">{m}</td>
                  <td className="py-2.5 text-right font-bold" style={{ color: COLORS.primary }}>{nous}</td>
                  <td className="py-2.5 text-right" style={{ color: '#9CA3B8' }}>{mtn}</td>
                  <td className="py-2.5 text-right font-bold" style={{ color: '#10B981' }}>−{eco}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top collecteurs */}
      {collecteurs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-black text-lg" style={{ color: '#0F172A' }}>
              🏆 Top collecteurs
            </h3>
            <p className="text-sm mt-1" style={{ color: '#9CA3B8' }}>
              Classement par commissions
            </p>
          </div>

          <div className="space-y-3">
            {[...collecteurs]
              .sort((a: { totalCommissions: number }, b: { totalCommissions: number }) => b.totalCommissions - a.totalCommissions)
              .slice(0, 10)
              .map((c: { id: string; nom: string; telephone: string; nbClients: number; totalCommissions: number }, i) => {
                const medals = ['🥇', '🥈', '🥉']
                const medal = medals[i] || `#${i + 1}`
                const couleur = i === 0 ? COLORS.warning : i === 1 ? COLORS.info : COLORS.primary

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl p-5 transition-all border-2"
                    style={{
                      background: '#FFFFFF',
                      border: `2px solid ${couleur}25`,
                      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${couleur}22`
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}40`
                      ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = `${couleur}25`
                      ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl font-black"
                        style={{
                          background: `${couleur}15`,
                          color: couleur,
                        }}
                      >
                        {medal}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base" style={{ color: '#0F172A' }}>
                          {c.nom}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#9CA3B8' }}>
                          {c.telephone} · {c.nbClients} clients
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black" style={{ color: couleur, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtFcfa(c.totalCommissions)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: `${couleur}15` }}>
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${(c.totalCommissions / [...collecteurs].sort((a: any, b: any) => b.totalCommissions - a.totalCommissions)[0].totalCommissions) * 100}%`,
                            background: couleur,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
