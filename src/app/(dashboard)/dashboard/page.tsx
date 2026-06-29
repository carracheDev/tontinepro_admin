'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import KpiCard from '@/components/dashboard/kpi-card'
import {
  Users, Coins, ArrowDownToLine, CreditCard,
  Banknote, TrendingUp, Scale, UserCheck,
  Activity, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, AreaChart, Area,
} from 'recharts'

// ─── Palette (bleu = marque, vert = succès) ────────────────────────────────────
const C = {
  blue: '#2563EB', navy: '#1E3A8A', sky: '#0EA5E9', violet: '#8B5CF6',
  green: '#16A34A', amber: '#F59E0B', red: '#EF4444', gray: '#9CA3AF',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data).catch(e => {
  if (e?.response?.status === 401) {
    localStorage.removeItem('admin_token')
    document.cookie = 'admin_token=; path=/; max-age=0'
    window.location.href = '/login'
  }
  return null
})

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
const fmtFcfa = (n: number) => fmt(n) + ' FCFA'

function heure() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}
const dateLocale = () =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// ─── Composants utilitaires ─────────────────────────────────────────────────────
function SectionTitle({ children, couleur = C.blue }: { children: React.ReactNode; couleur?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-1 h-4 rounded-full" style={{ background: couleur }} />
      <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{children}</h2>
    </div>
  )
}

function AlertStrip({ icon: Icon, message, href, couleur }: {
  icon: typeof Scale; message: string; href: string; couleur: string
}) {
  return (
    <Link href={href}>
      <div
        className="card-hover flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer"
        style={{ background: `${couleur}10`, border: `1px solid ${couleur}30`, color: couleur }}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1">{message}</span>
        <span className="font-bold text-xs opacity-70 bg-white/50 px-2 py-0.5 rounded-full">Voir →</span>
      </div>
    </Link>
  )
}

function StatRate({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card card-hover p-5 flex flex-col gap-2" style={{ borderBottom: `3px solid ${color}` }}>
      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}

// ─── Fil d'activité ──────────────────────────────────────────────────────────────
type Tx = {
  id: string; type: string; statut: string
  montantFcfa: number; creeLe: string
  utilisateur?: { nom: string }
}
const TYPE_LABEL: Record<string, string> = {
  COTISATION: 'Cotisation', RETRAIT: 'Retrait', COMMISSION: 'Commission', REMBOURSEMENT: 'Remboursement',
}

// ─── Page principale ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: kpis, isLoading: loadingKpis, mutate: refreshKpis } =
    useSWR('/analytics/kpis', fetcher, { refreshInterval: 60_000 })
  const { data: dash } = useSWR('/analytics/dashboard', fetcher, { refreshInterval: 120_000 })
  const { data: revenus } = useSWR('/analytics/evolution-revenus', fetcher)
  const { data: cotisations } = useSWR('/analytics/evolution-cotisations', fetcher)
  const { data: topCollecteurs } = useSWR('/analytics/top-collecteurs', fetcher)
  const { data: retraitsData } = useSWR('/retraits/en-attente', fetcher, { refreshInterval: 30_000 })
  const { data: litigesData } = useSWR('/litiges/en-cours/liste', fetcher, { refreshInterval: 60_000 })
  const { data: txData } = useSWR('/transactions/historique?limit=8&page=1', fetcher, { refreshInterval: 30_000 })

  const nbRetraits = Array.isArray(retraitsData) ? retraitsData.length : 0
  const litigesListe = Array.isArray(litigesData) ? litigesData
    : Array.isArray(litigesData?.litiges) ? litigesData.litiges : []
  const nbLitiges = litigesListe.filter((l: { statut: string }) => l.statut === 'OUVERT' || l.statut === 'EN_COURS').length
  const txListe: Tx[] = Array.isArray(txData) ? txData
    : Array.isArray(txData?.transactions) ? txData.transactions : []

  // Rangée résumé (en haut) — les indicateurs clés de pilotage.
  const kpisResume = [
    { titre: 'Clients actifs', valeur: kpis?.totalClients ?? '—', icone: Users, couleur: C.blue, sousTitre: 'Comptes enregistrés', href: '/utilisateurs' },
    { titre: 'Collecteurs', valeur: kpis?.totalCollecteurs ?? '—', icone: UserCheck, couleur: C.sky, sousTitre: 'Agents de terrain', href: '/collecteurs' },
    { titre: 'Taux remboursement', valeur: kpis?.tauxRemboursement != null ? `${kpis.tauxRemboursement}%` : '—', icone: TrendingUp, couleur: C.green, sousTitre: 'Crédits remboursés' },
    { titre: 'Éligibles PADME', valeur: kpis?.clientsEligiblesPADME ?? '—', icone: Activity, couleur: C.violet, sousTitre: 'Score ≥ 70', href: '/padme' },
  ]
  // Vue d'ensemble financière (sans doublon avec le résumé).
  const kpisPrimaires = [
    { titre: 'Volume cotisé', valeur: kpis?.volumeTotal != null ? fmtFcfa(kpis.volumeTotal) : '—', icone: TrendingUp, couleur: C.blue, sousTitre: 'Toutes tontines confondues' },
    { titre: 'Revenus total', valeur: kpis?.revenusTotal != null ? fmtFcfa(kpis.revenusTotal) : '—', icone: Banknote, couleur: C.amber, sousTitre: 'Crédits + abonnements + frais' },
    { titre: 'Commissions agents', valeur: kpis?.revenusCommissions != null ? fmtFcfa(kpis.revenusCommissions) : '—', icone: Coins, couleur: C.sky },
    { titre: 'Revenus micro-crédits', valeur: kpis?.revenusMicroCredits != null ? fmtFcfa(kpis.revenusMicroCredits) : '—', icone: CreditCard, couleur: C.violet, href: '/micro-credits' },
  ]
  const kpisSecondaires = [
    { titre: 'Éligibles micro-crédit', valeur: kpis?.clientsEligiblesMicroCredit ?? '—', icone: CreditCard, couleur: C.blue, sousTitre: 'Score ≥ 60', href: '/micro-credits' },
    { titre: 'Retraits en attente', valeur: nbRetraits, icone: ArrowDownToLine, couleur: nbRetraits > 0 ? C.amber : C.gray, badge: nbRetraits > 0 ? `${nbRetraits} urgent${nbRetraits > 1 ? 's' : ''}` : undefined, badgeCouleur: C.amber, href: '/retraits' },
    { titre: 'Taux commission', valeur: kpis?.tauxCommission != null ? `${kpis.tauxCommission}%` : '—', icone: Coins, couleur: C.green },
    { titre: 'Litiges ouverts', valeur: nbLitiges, icone: Scale, couleur: nbLitiges > 0 ? C.red : C.gray, href: '/litiges' },
  ]

  return (
    <div className="space-y-7 max-w-350">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              TontineBénin Administration
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
            {heure()}, Admin 👋
          </h1>
          <p className="text-sm mt-2 font-medium capitalize" style={{ color: 'var(--muted)' }}>{dateLocale()}</p>
        </div>
        <button
          onClick={() => refreshKpis()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-blue-50"
          style={{ color: C.blue, border: `1px solid ${C.blue}33`, background: '#fff' }}
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── Alertes urgentes ──────────────────────────────────────────────────── */}
      {(nbRetraits > 0 || nbLitiges > 0) && (
        <div className="flex flex-col gap-2">
          {nbRetraits > 0 && (
            <AlertStrip icon={ArrowDownToLine}
              message={`${nbRetraits} retrait${nbRetraits > 1 ? 's' : ''} ≥ 50 000 FCFA en attente de validation`}
              href="/retraits" couleur={C.amber} />
          )}
          {nbLitiges > 0 && (
            <AlertStrip icon={Scale}
              message={`${nbLitiges} litige${nbLitiges > 1 ? 's' : ''} ouvert${nbLitiges > 1 ? 's' : ''} nécessitant une action`}
              href="/litiges" couleur={C.red} />
          )}
        </div>
      )}

      {/* ── Statistiques clés (rangée résumé) ─────────────────────────────────── */}
      <div>
        <SectionTitle>Statistiques clés</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingKpis
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-36 animate-pulse" style={{ background: '#E5EBF5' }} />
              ))
            : kpisResume.map((c) => <KpiCard key={c.titre} {...c} />)}
        </div>
      </div>

      {/* ── KPIs primaires ────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle couleur={C.amber}>Vue d&apos;ensemble financière</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingKpis
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-36 animate-pulse" style={{ background: '#E5EBF5' }} />
              ))
            : kpisPrimaires.map((c) => <KpiCard key={c.titre} {...c} />)}
        </div>
      </div>

      {/* ── Graphique revenus + Fil activité ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card card-hover lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
            <div>
              <h3 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Revenus — 6 derniers mois</h3>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>Commissions · PADME</p>
            </div>
            <div className="flex items-center gap-2">
              {[{ color: C.blue, label: 'Commissions' }, { color: C.violet, label: 'PADME' }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: `${color}0F`, border: `1px solid ${color}26` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium" style={{ color }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={revenus ?? []} barSize={16} barGap={2}>
              <defs>
                <linearGradient id="gComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={1} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="gCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.violet} stopOpacity={1} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '10px 14px' }}
                formatter={(v, n) => [fmtFcfa(Number(v)), n]}
                cursor={{ fill: 'rgba(37,99,235,0.04)', radius: 8 }} />
              <Bar dataKey="commissions" name="Commissions" fill="url(#gComm)" radius={[6, 6, 0, 0]} stackId="a" />
              <Bar dataKey="padme" name="PADME" fill="url(#gCredit)" radius={[6, 6, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fil d'activité */}
        <div className="card card-hover p-6 flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Activité récente</h3>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>Dernières transactions</p>
            </div>
            <Link href="/transactions" className="text-xs font-bold px-3 py-2 rounded-lg transition-colors hover:bg-blue-100"
              style={{ color: C.blue, background: '#EFF4FF', border: `1px solid ${C.blue}26` }}>
              Tout voir →
            </Link>
          </div>

          {txListe.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#EFF4FF' }}>
                <Activity size={32} style={{ color: C.blue, opacity: 0.35 }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Aucune transaction</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Les transactions apparaîtront ici</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {txListe.slice(0, 6).map((tx) => {
                const ok = tx.statut === 'SUCCES' || tx.statut === 'COMPLETE'
                const col = ok ? C.green : C.amber
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${col}0A`, border: `1px solid ${col}26` }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ background: `${col}1F`, color: col }}>
                      {ok ? '✓' : '⏳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                        {tx.utilisateur?.nom ?? 'Utilisateur'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{TYPE_LABEL[tx.type] ?? tx.type}</p>
                    </div>
                    <span className="font-black text-sm shrink-0" style={{ color: col, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtFcfa(tx.montantFcfa)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs secondaires ──────────────────────────────────────────────────── */}
      <div>
        <SectionTitle couleur={C.violet}>Détail financier</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpisSecondaires.map((c) => <KpiCard key={c.titre} {...c} />)}
        </div>
      </div>

      {/* ── Indicateurs qualité ───────────────────────────────────────────────── */}
      {kpis && (
        <div>
          <SectionTitle couleur={C.sky}>Indicateurs qualité</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatRate label="Taux remboursement crédit" value={`${kpis.tauxRemboursement ?? 0}%`} color={C.green} />
            <StatRate label="Commission moyenne" value={kpis.tauxCommission ?? '—'} color={C.navy} />
            <StatRate label="Éligibles micro-crédit" value={kpis.clientsEligiblesMicroCredit ?? '—'} color={C.violet} />
            <StatRate label="Litiges ouverts" value={nbLitiges} color={nbLitiges > 0 ? C.red : C.green} />
          </div>
        </div>
      )}

      {/* ── Répartitions (donuts) ─────────────────────────────────────────────── */}
      {dash?.graphiques && (
        <div>
          <SectionTitle couleur={C.blue}>Répartitions</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DonutCard titre="KYC" icone="🛡️"
              data={(dash.graphiques.kycParStatut ?? []).map((s: { label: string; valeur: number }) => ({
                name: { VALIDE: 'Validés', EN_ATTENTE: 'En attente', REJETE: 'Rejetés' }[s.label] ?? s.label, value: s.valeur,
              }))}
              couleurs={[C.green, C.amber, C.red]} />
            <DonutCard titre="Tontines" icone="🪣"
              data={(dash.graphiques.tontinesParType ?? []).map((s: { label: string; valeur: number }) => ({
                name: { PERSONNEL: 'Personnel', GROUPE: 'Groupe', PROJET: 'Projet' }[s.label] ?? s.label, value: s.valeur,
              }))}
              couleurs={[C.blue, C.violet, C.amber]} />
            <DonutCard titre="Micro-crédits" icone="💳"
              data={(dash.graphiques.creditsParStatut ?? []).map((s: { label: string; valeur: number }) => ({
                name: { ACTIF: 'Actifs', EN_ATTENTE: 'Attente', EN_DEFAUT: 'Défaut', TERMINE: 'Terminés', REFUSE: 'Refusés' }[s.label] ?? s.label, value: s.valeur,
              }))}
              couleurs={[C.green, C.amber, C.red, C.blue, C.gray]} />
            {dash.graphiques.distributionScores && (
              <DonutCard titre="Scores" icone="⭐"
                data={[
                  { name: 'Faible', value: dash.graphiques.distributionScores.faible },
                  { name: 'Moyen', value: dash.graphiques.distributionScores.moyen },
                  { name: 'Bon', value: dash.graphiques.distributionScores.bon },
                  { name: 'Excel.', value: dash.graphiques.distributionScores.excellent },
                  { name: 'Élite', value: dash.graphiques.distributionScores.elite },
                ]}
                couleurs={[C.red, C.amber, C.sky, C.green, '#059669']} />
            )}
          </div>
        </div>
      )}

      {/* ── Évolution cotisations 12 mois ─────────────────────────────────────── */}
      {cotisations?.donnees && (
        <div>
          <SectionTitle couleur={C.blue}>Cotisations — 12 derniers mois</SectionTitle>
          <div className="card p-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cotisations.donnees} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCotis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '10px 14px' }}
                  formatter={(v) => [fmtFcfa(Number(v)), 'Cotisations']}
                  cursor={{ stroke: C.blue, strokeWidth: 1, strokeDasharray: '4 2' }} />
                <Area type="monotone" dataKey="montant" name="Cotisations" stroke={C.blue} strokeWidth={2.5}
                  fill="url(#gCotis)" dot={{ fill: C.blue, r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: C.blue, strokeWidth: 3, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top collecteurs ───────────────────────────────────────────────────── */}
      {topCollecteurs?.donnees?.length > 0 && (
        <div>
          <SectionTitle couleur={C.amber}>Top collecteurs</SectionTitle>
          <div className="card overflow-hidden">
            {topCollecteurs.donnees.map((c: { id: string; nom: string; telephone: string; nbClients: number; totalCommissions: number }, i: number) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 transition-colors hover:bg-slate-50"
                style={{ borderColor: '#F1F5F9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                  style={{ background: i === 0 ? `${C.amber}1F` : '#F1F5F9' }}>
                  {['🥇', '🥈', '🥉'][i] ?? `${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.nbClients} clients</p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: C.blue, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtFcfa(c.totalCommissions)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Donut réutilisable ───────────────────────────────────────────────────────
function DonutCard({ titre, icone, data, couleurs }: {
  titre: string; icone?: string; data: { name: string; value: number }[]; couleurs: string[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const dataWithColors = data.map((d, i) => ({ ...d, fill: couleurs[i % couleurs.length] }))

  if (total === 0) return (
    <div className="card flex flex-col items-center justify-center gap-2 p-5" style={{ minHeight: 230 }}>
      <span className="text-2xl opacity-30">{icone ?? '📊'}</span>
      <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{titre}</p>
      <p className="text-xs opacity-60" style={{ color: 'var(--muted)' }}>Aucune donnée</p>
    </div>
  )

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center gap-2 mb-3">
        {icone && <span className="text-base">{icone}</span>}
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{titre}</p>
        <span className="ml-auto text-xs font-black" style={{ color: 'var(--foreground)' }}>{total}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={dataWithColors} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '8px 12px' }}
            formatter={(v, name) => [`${v}  (${total > 0 ? Math.round(Number(v) / total * 100) : 0}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-1">
        {dataWithColors.map((d) => {
          const pct = total > 0 ? Math.round(d.value / total * 100) : 0
          return (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
              <span className="text-xs flex-1 truncate" style={{ color: 'var(--muted)' }}>{d.name}</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: d.fill }}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
