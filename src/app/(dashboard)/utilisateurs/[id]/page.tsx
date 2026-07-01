'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import {
  ArrowLeft, Phone, Calendar, ShieldCheck, ShieldX, Fingerprint,
  Wallet, PiggyBank, ArrowDownToLine, CreditCard, RotateCcw, Coins,
  CheckCircle2, AlertTriangle, Info, Ban, Play, Bell, KeyRound, FileCheck2,
  Smartphone, Globe, ScrollText, MessageSquareWarning, Layers, Award,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────
const fetcher = (url: string) => api.get(url).then((r) => r.data?.donnees ?? r.data)
const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' F'
const dateF = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const dateT = (d?: string) => (d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const initials = (nom: string) => (nom || '?').split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()

type Analyse = { ton: 'positif' | 'neutre' | 'alerte'; texte: string }
type Dossier = {
  profil: { id: string; nom: string; telephone: string; photo?: string | null; role: string; statut: string; kycVerifie: boolean; empreinteActive: boolean; tentativesEchouees: number; creeLe: string; ancienneteMois: number; collecteur?: { nom: string } | null; zone?: { nom: string; ville: string } | null }
  scores: { credit: number; fidelite: number; risque: number }
  financier: { soldeEpargne: number; soldeDisponible: number; totalCotise: number; totalRetire: number; encoursCredit: number; totalRembourse: number }
  analyse: Analyse[]
  badges: { niveau: string; obtenuLe: string }[]
  documentsKYC: { id: string; typeDocument: string; statut: string; creeLe: string; motifRejet?: string | null }[]
  tontines: { id: string; nom: string; type: string; statut: string; soldeActuelFcfa: number }[]
  transactions: { id: string; type: string; montantFcfa: number; statut: string; creeLe: string }[]
  microCredits: { id: string; montantPrincipalFcfa: number; montantRestantFcfa: number; statut: string; creeLe: string }[]
  retraits: { id: string; montantFcfa: number; statut: string; creeLe: string }[]
  litiges: { id: string; categorie: string; motif: string; statut: string; creeLe: string }[]
  sessions: { id: string; adresseIP?: string | null; userAgent?: string | null; actif: boolean; derniereUtilisation: string }[]
  appareils: { id: string; nomAppareil?: string | null; modeleAppareil?: string | null; systemeExploitation?: string | null; actif: boolean; derniereAuthentification?: string | null }[]
  journal: { action: string; details: string; adresseIP?: string | null; creeLe: string }[]
  compteurs: { tontines: number; transactions: number; microCredits: number; retraits: number }
}

// ─── Sous-composants ────────────────────────────────────────────────────
function Ring({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 26, c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 66, height: 66 }}>
        <svg width="66" height="66" className="-rotate-90">
          <circle cx="33" cy="33" r={r} fill="none" stroke="#EAECEF" strokeWidth="6" />
          <circle cx="33" cy="33" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c - (Math.max(0, Math.min(100, value)) / 100) * c} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color }}>{value}</div>
      </div>
      <span className="text-[11px] font-semibold text-gray-500">{label}</span>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-3.5" style={{ borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 text-gray-500">
        <Icon size={15} style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1.5 text-lg font-black tabular-nums" style={{ color: COLORS.text.primary }}>{value}</div>
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: COLORS.opacity(color, 0.12), color }}>{text}</span>
}

const statutColor = (s: string) => (s === 'ACTIF' ? COLORS.success : s === 'SUSPENDU' || s === 'BANNI' ? COLORS.danger : COLORS.warning)
const txColor = (t: string) => (t === 'RETRAIT' || t === 'DISTRIBUTION_GROUPE' ? COLORS.danger : COLORS.primary)
const etatColor = (s: string) => (['SUCCES', 'VALIDE', 'EXECUTE', 'VALIDE', 'TERMINE', 'RESOLU'].includes(s) ? COLORS.success : ['ECHOUE', 'REJETE', 'ECHEC', 'EN_DEFAUT'].includes(s) ? COLORS.danger : COLORS.warning)

// ─── Page ───────────────────────────────────────────────────────────────
export default function FicheClient360() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR<Dossier>(id ? `/utilisateurs/${id}/dossier-360` : null, fetcher)
  const [tab, setTab] = useState('apercu')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; t: string } | null>(null)

  const notify = (ok: boolean, t: string) => { setToast({ ok, t }); setTimeout(() => setToast(null), 3200) }

  async function changerStatut(statut: string) {
    if (!confirm(`Confirmer : passer le compte en ${statut} ?`)) return
    setBusy(true)
    try {
      await api.put(`/utilisateurs/${id}/statut`, { statut })
      await mutate()
      notify(true, `Compte ${statut.toLowerCase()}.`)
    } catch (e) { notify(false, extraireErreur(e)) } finally { setBusy(false) }
  }

  if (isLoading) return <div className="p-10 text-center text-gray-400">Chargement du dossier…</div>
  if (!data) return <div className="p-10 text-center text-gray-400">Client introuvable.</div>

  const { profil: p, scores, financier: f, analyse } = data
  const tabs = [
    { k: 'apercu', label: 'Aperçu', icon: Layers },
    { k: 'financier', label: 'Financier', icon: Wallet },
    { k: 'kyc', label: 'KYC', icon: FileCheck2 },
    { k: 'securite', label: 'Sécurité', icon: ShieldCheck },
    { k: 'litiges', label: `Litiges (${data.litiges.length})`, icon: MessageSquareWarning },
    { k: 'activite', label: 'Activité', icon: ScrollText },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-1">
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          style={{ background: toast.ok ? 'rgba(22,163,74,.96)' : 'rgba(220,38,38,.96)' }}>{toast.t}</div>
      )}

      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Retour
      </button>

      {/* EN-TÊTE */}
      <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.border }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}>
              {initials(p.nom)}
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: COLORS.text.primary }}>{p.nom}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Phone size={13} /> {p.telephone}</span>
                <span className="flex items-center gap-1"><Calendar size={13} /> depuis {p.ancienneteMois} mois</span>
                {p.zone && <span>{p.zone.ville}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge text={p.statut} color={statutColor(p.statut)} />
                <Badge text={p.kycVerifie ? 'KYC vérifié' : 'KYC non vérifié'} color={p.kycVerifie ? COLORS.success : COLORS.warning} />
                <Badge text={p.role} color={COLORS.info} />
                {p.empreinteActive && <Badge text="Biométrie" color={COLORS.primary} />}
                {p.tentativesEchouees > 0 && <Badge text={`${p.tentativesEchouees} échecs PIN`} color={COLORS.danger} />}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="flex gap-5">
            <Ring value={scores.credit} label="Crédit" color={COLORS.primary} />
            <Ring value={scores.fidelite} label="Fidélité" color={COLORS.success} />
            <Ring value={scores.risque} label="Risque" color={scores.risque >= 60 ? COLORS.danger : scores.risque >= 30 ? COLORS.warning : COLORS.success} />
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: COLORS.border }}>
          {p.statut === 'ACTIF' ? (
            <button disabled={busy} onClick={() => changerStatut('SUSPENDU')} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLORS.danger }}><Ban size={14} /> Suspendre</button>
          ) : (
            <button disabled={busy} onClick={() => changerStatut('ACTIF')} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLORS.success }}><Play size={14} /> Réactiver</button>
          )}
          {[
            { icon: FileCheck2, t: 'Forcer KYC' }, { icon: KeyRound, t: 'Reset tentatives' },
            { icon: Bell, t: 'Notifier' }, { icon: Smartphone, t: 'Bloquer appareil' },
          ].map((a) => (
            <button key={a.t} disabled title="Bientôt (incrément suivant)" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-400" style={{ borderColor: COLORS.border }}><a.icon size={14} /> {a.t}</button>
          ))}
        </div>
      </div>

      {/* ANALYSE AUTOMATIQUE */}
      <div className="rounded-2xl border p-4" style={{ borderColor: COLORS.opacity(COLORS.primary, 0.25), background: COLORS.opacity(COLORS.primary, 0.04) }}>
        <div className="mb-2 flex items-center gap-2 text-sm font-black" style={{ color: COLORS.primaryDark }}>🧠 Analyse automatique</div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {analyse.map((a, i) => {
            const c = a.ton === 'positif' ? COLORS.success : a.ton === 'alerte' ? COLORS.danger : COLORS.text.secondary
            const Ic = a.ton === 'positif' ? CheckCircle2 : a.ton === 'alerte' ? AlertTriangle : Info
            return <div key={i} className="flex items-start gap-2 text-sm" style={{ color: COLORS.text.primary }}><Ic size={16} style={{ color: c, marginTop: 1, flexShrink: 0 }} /> {a.texte}</div>
          })}
        </div>
      </div>

      {/* CARTES FINANCIÈRES */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={PiggyBank} label="Épargne" value={fcfa(f.soldeEpargne)} color={COLORS.primary} />
        <Stat icon={Wallet} label="Disponible" value={fcfa(f.soldeDisponible)} color={COLORS.success} />
        <Stat icon={Coins} label="Total cotisé" value={fcfa(f.totalCotise)} color={COLORS.primary} />
        <Stat icon={ArrowDownToLine} label="Total retiré" value={fcfa(f.totalRetire)} color={COLORS.danger} />
        <Stat icon={CreditCard} label="Encours crédit" value={fcfa(f.encoursCredit)} color={COLORS.warning} />
        <Stat icon={RotateCcw} label="Remboursé" value={fcfa(f.totalRembourse)} color={COLORS.success} />
      </div>

      {/* ONGLETS */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: COLORS.border }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold"
            style={tab === t.k ? { color: COLORS.primary, borderBottom: `2px solid ${COLORS.primary}` } : { color: COLORS.text.secondary }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4" style={{ borderColor: COLORS.border }}>
        {tab === 'apercu' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title={`Tontines (${data.compteurs.tontines})`} rows={data.tontines.map((t) => [t.nom, <Badge key="1" text={t.statut} color={etatColor(t.statut)} />, fcfa(t.soldeActuelFcfa)])} empty="Aucune tontine" />
            <Section title="Dernières transactions" rows={data.transactions.slice(0, 8).map((t) => [<span key="t" style={{ color: txColor(t.type) }}>{t.type}</span>, dateT(t.creeLe), <span key="m" style={{ color: txColor(t.type), fontWeight: 800 }}>{fcfa(t.montantFcfa)}</span>])} empty="Aucune transaction" />
          </div>
        )}
        {tab === 'financier' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Retraits" rows={data.retraits.map((r) => [dateT(r.creeLe), <Badge key="s" text={r.statut} color={etatColor(r.statut)} />, fcfa(r.montantFcfa)])} empty="Aucun retrait" />
            <Section title="Micro-crédits" rows={data.microCredits.map((m) => [dateF(m.creeLe), <Badge key="s" text={m.statut} color={etatColor(m.statut)} />, `${fcfa(m.montantRestantFcfa)} / ${fcfa(m.montantPrincipalFcfa)}`])} empty="Aucun crédit" />
          </div>
        )}
        {tab === 'kyc' && (
          <Section title="Documents KYC" rows={data.documentsKYC.map((d) => [d.typeDocument, dateF(d.creeLe), <Badge key="s" text={d.statut} color={etatColor(d.statut)} />])} empty="Aucun document soumis" />
        )}
        {tab === 'securite' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Sessions récentes" rows={data.sessions.map((s) => [<span key="ip" className="flex items-center gap-1"><Globe size={13} /> {s.adresseIP || '—'}</span>, dateT(s.derniereUtilisation), <Badge key="a" text={s.actif ? 'active' : 'expirée'} color={s.actif ? COLORS.success : COLORS.text.muted} />])} empty="Aucune session" />
            <Section title="Appareils" rows={data.appareils.map((a) => [<span key="d" className="flex items-center gap-1"><Smartphone size={13} /> {a.nomAppareil || a.modeleAppareil || 'Appareil'}</span>, a.systemeExploitation || '—', <Badge key="a" text={a.actif ? 'actif' : 'inactif'} color={a.actif ? COLORS.success : COLORS.text.muted} />])} empty="Aucun appareil enregistré" />
          </div>
        )}
        {tab === 'litiges' && (
          <Section title="Historique des litiges" rows={data.litiges.map((l) => [l.categorie, l.motif?.slice(0, 40), dateF(l.creeLe), <Badge key="s" text={l.statut} color={etatColor(l.statut)} />])} empty="Aucun litige — client sans incident ✅" />
        )}
        {tab === 'activite' && (
          <Section title="Journal d'audit" rows={data.journal.map((j) => [<span key="a" className="font-semibold">{j.action}</span>, j.details?.slice(0, 50), dateT(j.creeLe)])} empty="Aucune activité enregistrée" />
        )}
      </div>
    </div>
  )
}

function Section({ title, rows, empty }: { title: string; rows: any[][]; empty: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">{title}</div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-gray-400" style={{ borderColor: COLORS.border }}>{empty}</div>
      ) : (
        <div className="divide-y" style={{ borderColor: COLORS.border }}>
          {rows.map((cells, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              {cells.map((c, j) => (
                <span key={j} className={j === 0 ? 'flex-1 font-medium' : 'text-right text-gray-600'} style={{ color: j === 0 ? COLORS.text.primary : undefined }}>{c}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
