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
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts'

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
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
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
    useSWR('/litiges/en-cours/liste', fetcher, { refreshInterval: 60_000 })

  const { data: txData } =
    useSWR('/transactions/historique?limit=8&page=1', fetcher, { refreshInterval: 30_000 })

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
        className="rounded-3xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0F2D1A 40%, #14532D 75%, #16A34A 100%)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.40), 0 4px 12px rgba(22,163,74,0.15)',
        }}
      >
        {/* Cercles décoratifs lumineux */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-4 right-1/3 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />

        {/* Ligne décorative verte en haut */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(22,163,74,0.6), transparent)' }} />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgba(134,239,172,0.8)' }}>
                TontineBénin Administration
              </p>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {heure()}, Admin 👋
            </h1>
            <p className="text-sm mt-1.5 capitalize font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {dateLocale()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(22,163,74,0.18)', border: '1px solid rgba(22,163,74,0.35)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: 'rgba(134,239,172,0.9)' }}>Live — refresh auto</span>
            </div>
            <button onClick={() => refreshKpis()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}>
              <RefreshCw size={13} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Mini stats inline */}
        {kpis && (
          <div className="relative flex gap-8 mt-6 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            {[
              { label: 'Clients', val: kpis.totalClients, color: '#86EFAC' },
              { label: 'Collecteurs', val: kpis.totalCollecteurs, color: '#93C5FD' },
              { label: 'Taux remb.', val: `${kpis.tauxRemboursement ?? 0}%`, color: '#FCD34D' },
              { label: 'PADME éligibles', val: kpis.clientsEligiblesPADME ?? 0, color: '#C4B5FD' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-xl font-black leading-none" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{val}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
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
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                Revenus — 6 derniers mois
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Commissions · PADME · Retraits</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { color: '#16A34A', label: 'Commissions' },
                { color: '#8B5CF6', label: 'Crédits' },
                { color: '#F59E0B', label: 'Abo.' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={revenus ?? []} barSize={14} barGap={2}>
              <defs>
                <linearGradient id="gComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={1} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gAbo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#FCD34D" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '10px 14px' }}
                formatter={(v, n) => [fmtFcfa(Number(v)), n]}
                cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
              />
              <Bar dataKey="commissions"         name="Commissions"   fill="url(#gComm)"   radius={[6, 6, 0, 0]} stackId="a" />
              <Bar dataKey="padme"               name="PADME"         fill="url(#gCredit)" radius={[6, 6, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fil d'activité récente */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 flex flex-col"
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
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

      {/* ── Camemberts ────────────────────────────────────────────────────────── */}
      {dash?.graphiques && (
        <div>
          <SectionTitle couleur="#06B6D4">Répartitions</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DonutCard
              titre="KYC"
              icone="🛡️"
              data={(dash.graphiques.kycParStatut ?? []).map((s: {label: string; valeur: number}) => ({
                name: { VALIDE: 'Validés', EN_ATTENTE: 'En attente', REJETE: 'Rejetés' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#F59E0B', '#EF4444']}
            />
            <DonutCard
              titre="Tontines"
              icone="🪣"
              data={(dash.graphiques.tontinesParType ?? []).map((s: {label: string; valeur: number}) => ({
                name: { PERSONNEL: 'Personnel', GROUPE: 'Groupe', PROJET: 'Projet' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#3B82F6', '#F59E0B']}
            />
            <DonutCard
              titre="Micro-crédits"
              icone="💳"
              data={(dash.graphiques.creditsParStatut ?? []).map((s: {label: string; valeur: number}) => ({
                name: { ACTIF: 'Actifs', EN_ATTENTE: 'Attente', EN_DEFAUT: 'Défaut', TERMINE: 'Terminés', REFUSE: 'Refusés' }[s.label] ?? s.label,
                value: s.valeur,
              }))}
              couleurs={['#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#9CA3AF']}
            />
            {dash.graphiques.distributionScores && (
              <DonutCard
                titre="Scores"
                icone="⭐"
                data={[
                  { name: 'Faible', value: dash.graphiques.distributionScores.faible },
                  { name: 'Moyen',  value: dash.graphiques.distributionScores.moyen  },
                  { name: 'Bon',    value: dash.graphiques.distributionScores.bon    },
                  { name: 'Excel.', value: dash.graphiques.distributionScores.excellent },
                  { name: 'Élite',  value: dash.graphiques.distributionScores.elite  },
                ]}
                couleurs={['#EF4444', '#F59E0B', '#3B82F6', '#16A34A', '#059669']}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Évolution cotisations 12 mois — AreaChart avec gradient ───────── */}
      {dash?.graphiques?.evolutionMensuelle && (
        <div>
          <SectionTitle couleur="#16A34A">Cotisations — 12 derniers mois</SectionTitle>
          <div className="rounded-2xl p-6"
            style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dash.graphiques.evolutionMensuelle} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCotis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '10px 14px' }}
                  formatter={(v) => [fmtFcfa(Number(v)), 'Cotisations']}
                  cursor={{ stroke: '#16A34A', strokeWidth: 1, strokeDasharray: '4 2' }}
                />
                <Area type="monotone" dataKey="montant" name="Cotisations"
                  stroke="#16A34A" strokeWidth={2.5}
                  fill="url(#gCotis)"
                  dot={{ fill: '#16A34A', r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#16A34A', strokeWidth: 3, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top collecteurs ───────────────────────────────────────────────────── */}
      {dash?.topCollecteurs?.length > 0 && (
        <div>
          <SectionTitle couleur="#F59E0B">Top collecteurs</SectionTitle>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)' }}>
            {dash.topCollecteurs.map((c: {id: string; nom: string; telephone: string; nbClients: number; totalCommissions: number}, i: number) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 transition-colors hover:bg-gray-50"
                style={{ borderColor: '#F8FAFC' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                  style={{ background: i === 0 ? 'rgba(245,158,11,0.12)' : '#F8FAFC' }}>
                  {['🥇', '🥈', '🥉'][i] ?? `${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.nom}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.nbClients} clients</p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
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

function DonutCard({ titre, icone, data, couleurs }: {
  titre: string
  icone?: string
  data: { name: string; value: number }[]
  couleurs: string[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const dataWithColors = data.map((d, i) => ({ ...d, fill: couleurs[i % couleurs.length] }))

  if (total === 0) return (
    <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
      style={{ background: '#fff', border: '1px solid #E2E8F0', minHeight: 230 }}>
      <span className="text-2xl opacity-30">{icone ?? '📊'}</span>
      <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{titre}</p>
      <p className="text-xs opacity-60" style={{ color: 'var(--muted)' }}>Aucune donnée</p>
    </div>
  )

  return (
    <div className="rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)' }}>

      {/* En-tête */}
      <div className="flex items-center gap-2 mb-3">
        {icone && <span className="text-base">{icone}</span>}
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{titre}</p>
        <span className="ml-auto text-xs font-black" style={{ color: 'var(--foreground)' }}>{total}</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={58}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12, border: 'none', fontSize: 11,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '8px 12px',
            }}
            formatter={(v, name) => [
              `${v}  (${total > 0 ? Math.round(Number(v) / total * 100) : 0}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Légende compacte */}
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
