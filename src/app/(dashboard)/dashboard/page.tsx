'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import KpiCard from '@/components/dashboard/kpi-card'
import {
  Users, Coins, ArrowDownToLine, CreditCard,
  Banknote, TrendingUp, Scale, ShieldAlert,
  Activity, RefreshCw, CheckCircle, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Legend,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
function fmtFcfa(n: number) { return fmt(n) + ' FCFA' }

function heure() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function dateLocale() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Composants utilitaires ────────────────────────────────────────────────────

function SectionTitle({ children, couleur = '#16A34A' }: { children: React.ReactNode; couleur?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-1 h-4 rounded-full" style={{ background: couleur }} />
      <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {children}
      </h2>
    </div>
  )
}

function AlertStrip({
  icon: Icon, message, href, couleur,
}: { icon: typeof ShieldAlert; message: string; href: string; couleur: string }) {
  return (
    <Link href={href}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{
          background: `${couleur}10`,
          border: `1px solid ${couleur}30`,
          color: couleur,
          boxShadow: `0 1px 4px ${couleur}12`,
        }}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1">{message}</span>
        <span className="font-bold text-xs opacity-60 bg-white/40 px-2 py-0.5 rounded-full">Voir →</span>
      </div>
    </Link>
  )
}

function StatRate({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2 transition-all hover:-translate-y-0.5"
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        borderBottom: `3px solid ${color}`,
      }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}

// ─── Fil d'activité ────────────────────────────────────────────────────────────

type Tx = {
  id: string; type: string; statut: string
  montantFcfa: number; creeLe: string
  utilisateur?: { nom: string }
}

function FeedRow({ tx }: { tx: Tx }) {
  const ok = tx.statut === 'SUCCES' || tx.statut === 'COMPLETE'
  const Icon = ok ? CheckCircle : Clock
  const typeLabel: Record<string, string> = {
    COTISATION: 'Cotisation',
    RETRAIT: 'Retrait',
    COMMISSION: 'Commission',
    REMBOURSEMENT: 'Remboursement',
  }
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <Icon size={15} style={{ color: ok ? 'var(--primary)' : 'var(--warning)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {tx.utilisateur?.nom ?? 'Utilisateur'}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {typeLabel[tx.type] ?? tx.type}
        </p>
      </div>
      <span className="text-sm font-bold shrink-0" style={{ color: ok ? 'var(--primary)' : 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
        {fmtFcfa(tx.montantFcfa)}
      </span>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: kpis, isLoading: loadingKpis, mutate: refreshKpis } =
    useSWR('/analytics/kpis', fetcher, { refreshInterval: 60_000 })

  const { data: dash } = useSWR('/analytics/dashboard', fetcher, { refreshInterval: 120_000 })

  const { data: revenus } = useSWR('/analytics/evolution-revenus', fetcher)

  const { data: retraitsData } =
    useSWR('/retraits/en-attente', fetcher, { refreshInterval: 30_000 })

  const { data: litigesData } =
    useSWR('/litiges', fetcher, { refreshInterval: 60_000 })

  const { data: txData } =
    useSWR('/transactions?limit=8&page=1', fetcher, { refreshInterval: 30_000 })

  // ── Comptages ───────────────────────────────────────────────────────────────
  const nbRetraits = Array.isArray(retraitsData) ? retraitsData.length : 0

  const litigesListe = Array.isArray(litigesData)
    ? litigesData
    : Array.isArray(litigesData?.litiges)
      ? litigesData.litiges
      : []
  const nbLitiges = litigesListe.filter((l: { statut: string }) =>
    l.statut === 'OUVERT' || l.statut === 'EN_COURS'
  ).length

  const txListe: Tx[] = Array.isArray(txData)
    ? txData
    : Array.isArray(txData?.transactions)
      ? txData.transactions
      : []

  // ── Cartes KPI primaires — chaque carte a sa couleur unique ───────────────
  const kpisPrimaires = [
    {
      titre: 'Clients actifs',
      valeur: kpis?.totalClients ?? '—',
      icone: Users,
      couleur: '#16A34A',    // vert
      sousTitre: 'Comptes enregistrés',
      href: '/utilisateurs',
    },
    {
      titre: 'Collecteurs actifs',
      valeur: kpis?.totalCollecteurs ?? '—',
      icone: Users,
      couleur: '#3B82F6',    // bleu
      sousTitre: 'Agents de terrain',
      href: '/collecteurs',
    },
    {
      titre: 'Volume cotisé',
      valeur: kpis?.volumeTotal != null ? fmtFcfa(kpis.volumeTotal) : '—',
      icone: TrendingUp,
      couleur: '#8B5CF6',    // violet
      sousTitre: 'Toutes tontines confondues',
    },
    {
      titre: 'Revenus total',
      valeur: kpis?.revenusTotal != null ? fmtFcfa(kpis.revenusTotal) : '—',
      icone: Banknote,
      couleur: '#F59E0B',    // or/amber
      sousTitre: 'Commissions + crédits + abo.',
    },
  ]

  // ── Cartes KPI secondaires ─────────────────────────────────────────────────
  const kpisSecondaires = [
    {
      titre: 'Commissions agents',
      valeur: kpis?.revenusCommissions != null ? fmtFcfa(kpis.revenusCommissions) : '—',
      icone: Coins,
      couleur: '#16A34A',
    },
    {
      titre: 'Revenus micro-crédits',
      valeur: kpis?.revenusMicroCredits != null ? fmtFcfa(kpis.revenusMicroCredits) : '—',
      icone: CreditCard,
      couleur: '#8B5CF6',
      href: '/micro-credits',
    },
    {
      titre: 'Éligibles PADME',
      valeur: kpis?.clientsEligiblesPADME ?? '—',
      icone: Activity,
      couleur: '#06B6D4',    // cyan
      sousTitre: 'Score ≥ 70',
      href: '/padme',
    },
    {
      titre: 'Retraits en attente',
      valeur: nbRetraits,
      icone: ArrowDownToLine,
      couleur: nbRetraits > 0 ? '#F59E0B' : '#9CA3AF',
      badge: nbRetraits > 0 ? `${nbRetraits} urgent${nbRetraits > 1 ? 's' : ''}` : undefined,
      badgeCouleur: '#F59E0B',
      href: '/retraits',
    },
  ]

  return (
    <div className="space-y-7 max-w-350">

      {/* ── Hero header ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #16A34A22 100%)',
          boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
        }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: '#16A34A' }} />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full opacity-5"
          style={{ background: '#3B82F6' }} />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              TontineBénin Administration
            </p>
            <h1 className="text-2xl font-black text-white">
              {heure()}, Admin 👋
            </h1>
            <p className="text-sm mt-1 capitalize" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {dateLocale()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-white">Live — refresh auto</span>
            </div>
            <button onClick={() => refreshKpis()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/20"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <RefreshCw size={13} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Mini stats inline */}
        {kpis && (
          <div className="relative flex gap-6 mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { label: 'Clients', val: kpis.totalClients },
              { label: 'Collecteurs', val: kpis.totalCollecteurs },
              { label: 'Taux remb.', val: `${kpis.tauxRemboursement ?? 0}%` },
              { label: 'PADME éligibles', val: kpis.clientsEligiblesPADME ?? 0 },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-lg font-black text-white"
                  style={{ fontVariantNumeric: 'tabular-nums' }}>{val}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Alertes urgentes ──────────────────────────────────────────────────── */}
      {(nbRetraits > 0 || nbLitiges > 0) && (
        <div className="flex flex-col gap-2">
          {nbRetraits > 0 && (
            <AlertStrip
              icon={ArrowDownToLine}
              message={`${nbRetraits} retrait${nbRetraits > 1 ? 's' : ''} ≥ 50 000 FCFA en attente de validation`}
              href="/retraits"
              couleur="#F59E0B"
            />
          )}
          {nbLitiges > 0 && (
            <AlertStrip
              icon={Scale}
              message={`${nbLitiges} litige${nbLitiges > 1 ? 's' : ''} ouvert${nbLitiges > 1 ? 's' : ''} nécessitant une action`}
              href="/litiges"
              couleur="#EF4444"
            />
          )}
        </div>
      )}

      {/* ── KPIs primaires ────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle couleur="#16A34A">Vue d&apos;ensemble</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingKpis
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: '#F1F5F9' }} />
              ))
            : kpisPrimaires.map((c) => <KpiCard key={c.titre} {...c} />)
          }
        </div>
      </div>

      {/* ── Graphique + Fil activité ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Graphique revenus 6 mois */}
        <div
          className="lg:col-span-3 rounded-2xl p-6 transition-shadow hover:shadow-lg"
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                Revenus — 6 derniers mois
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Commissions · Micro-crédits · Abonnements</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
              FCFA
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenus ?? []} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: 'none', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                formatter={(v) => [fmtFcfa(Number(v))]}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              <Bar dataKey="commissions"         name="Commissions"   fill="#16A34A" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="revenusMicroCredits" name="Micro-crédits" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="abonnements"         name="Abonnements"   fill="#F59E0B" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fil d'activité récente */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 flex flex-col"
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Activité récente</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Dernières transactions</p>
            </div>
            <Link href="/utilisateurs"
              className="text-xs font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-green-50"
              style={{ color: '#16A34A', border: '1px solid #BBF7D0' }}>
              Tout voir →
            </Link>
          </div>

          {txListe.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-6">
              <Activity size={28} style={{ color: '#E5E7EB' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Aucune transaction récente</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-0">
              {txListe.slice(0, 8).map((tx) => <FeedRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs secondaires ──────────────────────────────────────────────────── */}
      <div>
        <SectionTitle couleur="#8B5CF6">Détail financier</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpisSecondaires.map((c) => <KpiCard key={c.titre} {...c} />)}
        </div>
      </div>

      {/* ── Taux clés ────────────────────────────────────────────────────────── */}
      {kpis && (
        <div>
          <SectionTitle couleur="#3B82F6">Indicateurs qualité</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatRate label="Taux remboursement crédit" value={`${kpis.tauxRemboursement ?? 0}%`} color="#16A34A" />
            <StatRate label="Commission moyenne" value={kpis.tauxCommission ?? '—'} color="var(--foreground)" />
            <StatRate label="Éligibles micro-crédit" value={kpis.clientsEligiblesMicroCredit ?? '—'} color="#8B5CF6" />
            <StatRate label="Litiges ouverts" value={nbLitiges} color={nbLitiges > 0 ? '#EF4444' : '#16A34A'} />
          </div>
        </div>
      )}

      {/* ── Graphiques en camembert ────────────────────────────────────────── */}
      {dash?.graphiques && (
        <div>
          <SectionTitle>Répartitions — graphiques</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* KYC */}
            <DonutCard
              titre="Statuts KYC"
              data={(dash.graphiques.kycParStatut ?? []).map((s: {label: string; valeur: number}) => ({
                name: { VALIDE: 'Validés', EN_ATTENTE: 'En attente', REJETE: 'Rejetés' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#D97706', '#DC2626']}
            />

            {/* Tontines par type */}
            <DonutCard
              titre="Types de tontines"
              data={(dash.graphiques.tontinesParType ?? []).map((s: {label: string; valeur: number}) => ({
                name: { PERSONNEL: 'Personnel', GROUPE: 'Groupe', PROJET: 'Projet' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#1A56DB', '#D97706']}
            />

            {/* Crédits par statut */}
            <DonutCard
              titre="Statuts micro-crédits"
              data={(dash.graphiques.creditsParStatut ?? []).map((s: {label: string; valeur: number}) => ({
                name: { ACTIF: 'Actifs', EN_ATTENTE: 'En attente', EN_DEFAUT: 'En défaut', TERMINE: 'Terminés', REFUSE: 'Refusés' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#D97706', '#DC2626', '#7C3AED', '#9CA3AF']}
            />

            {/* Distribution scores */}
            {dash.graphiques.distributionScores && (() => {
              const d = dash.graphiques.distributionScores
              return (
                <DonutCard
                  titre="Distribution scores"
                  data={[
                    { name: 'Faible (<40)', value: d.faible },
                    { name: 'Moyen (40-60)', value: d.moyen },
                    { name: 'Bon (60-75)', value: d.bon },
                    { name: 'Excellent (75-90)', value: d.excellent },
                    { name: 'Élite (90+)', value: d.elite },
                  ]}
                  couleurs={['#DC2626', '#D97706', '#1A56DB', '#16A34A', '#059669']}
                />
              )
            })()}

          </div>
        </div>
      )}

      {/* ── Évolution cotisations 12 mois (dashboard endpoint) ─────────────── */}
      {dash?.graphiques?.evolutionMensuelle && (
        <div>
          <SectionTitle>Cotisations — 12 derniers mois</SectionTitle>
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dash.graphiques.evolutionMensuelle} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                  formatter={(v) => [fmtFcfa(Number(v)), 'Cotisations']}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="montant" name="Cotisations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top collecteurs ────────────────────────────────────────────────── */}
      {dash?.topCollecteurs?.length > 0 && (
        <div>
          <SectionTitle>Top collecteurs</SectionTitle>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            {dash.topCollecteurs.map((c: {id: string; nom: string; telephone: string; nbClients: number; totalCommissions: number}, i: number) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                <span className="text-lg shrink-0">{['🥇', '🥈', '🥉'][i] ?? `${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.nbClients} clients · {c.telephone}</p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
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

// ─── Composant Donut réutilisable ──────────────────────────────────────────────

function DonutCard({ titre, data, couleurs }: {
  titre: string
  data: { name: string; value: number }[]
  couleurs: string[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)

  // Recharts v3 : injecter fill directement dans chaque entrée (remplace Cell)
  const dataWithColors = data.map((d, i) => ({ ...d, fill: couleurs[i % couleurs.length] }))

  if (total === 0) return (
    <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', minHeight: 220 }}>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{titre}</p>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>Aucune donnée</p>
    </div>
  )

  return (
    <div className="rounded-2xl p-5 transition-shadow hover:shadow-md"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{titre}</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="45%"
            innerRadius={42}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            formatter={(v, name) => [`${v} (${total > 0 ? Math.round(Number(v) / total * 100) : 0}%)`, name]}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(v) => <span style={{ color: 'var(--muted)' }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
