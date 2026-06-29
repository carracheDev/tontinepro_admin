'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import { Coins, TrendingUp, RefreshCw, Play, Pause, CheckCircle2, AlertTriangle, Filter, Banknote } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type Tontine = {
  id: string; nom: string
  type: 'PERSONNELLE' | 'GROUPE' | 'PROJET'
  statut: 'CREATION' | 'ACTIVE' | 'SUSPENDUE' | 'TERMINEE'
  frequence: string; montantJournalierFcfa: number
  soldeActuelFcfa: number; objectifMontantFcfa: number | null
  creeLe: string
  proprietaire: { id: string; nom: string; telephone: string }
  _count: { membres: number; transactions: number }
}

const TYPE = {
  PERSONNELLE: { label: 'Personnelle', c: '#2563EB', bg: 'rgba(22,163,74,0.12)' },
  GROUPE:      { label: 'Groupe',      c: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  PROJET:      { label: 'Projet',      c: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
}
const STATUT = {
  CREATION:  { label: 'En création', c: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: AlertTriangle },
  ACTIVE:    { label: 'Active',      c: '#2563EB', bg: 'rgba(22,163,74,0.12)',   icon: CheckCircle2 },
  SUSPENDUE: { label: 'Suspendue',   c: '#EF4444', bg: 'rgba(239,68,68,0.12)',   icon: Pause },
  TERMINEE:  { label: 'Terminée',    c: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: CheckCircle2 },
}

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : `${n}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function KpiPremium({ titre, valeur, couleur, Icon, sousTitre }: { titre: string; valeur: string | number; couleur: string; Icon: React.ElementType; sousTitre: string }) {
  return (
    <div className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${couleur}18 0%, ${couleur}08 100%)`, border: `1.5px solid ${couleur}35`, boxShadow: `0 4px 16px ${couleur}20` }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 10px 28px ${couleur}35` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = `0 4px 16px ${couleur}20` }}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${couleur}, ${couleur}88)` }} />
      <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full" style={{ background: `${couleur}18` }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mt-1" style={{ background: `${couleur}25`, border: `1px solid ${couleur}40` }}>
        <Icon size={20} style={{ color: couleur }} />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{valeur}</p>
        <p className="text-xs font-bold mt-1" style={{ color: couleur }}>{titre}</p>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{sousTitre}</p>
      </div>
    </div>
  )
}

export default function TontinesPage() {
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [type, setType] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const params = new URLSearchParams({ page: String(page), limite: '12' })
  if (statut) params.set('statut', statut)
  if (type)   params.set('type', type)

  const { data, isLoading, mutate } = useSWR(`/tontines?${params}`, fetcher, { refreshInterval: 60_000 })
  const tontines: Tontine[] = data?.tontines ?? []
  const total = data?.total ?? 0
  const totalPages = data?.pages ?? 1

  function showToast(t: 'ok' | 'err', text: string) {
    setToast({ type: t, text })
    setTimeout(() => setToast(null), 3000)
  }

  async function doAction(id: string, endpoint: string, label: string) {
    setActionLoading(id + endpoint)
    try {
      await api.post(`/tontines/${id}/${endpoint}`)
      await mutate()
      showToast('ok', `${label} effectué`)
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2"
          style={{ background: toast.type === 'ok' ? '#2563EB' : '#EF4444', color: '#fff' }}>
          <CheckCircle2 size={16} />{toast.text}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0F172A' }}>Tontines</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{total} tontine(s) sur la plateforme</p>
        </div>
        <button onClick={() => mutate()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#EFF4FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
          <RefreshCw size={14} />Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiPremium titre="Total" valeur={total} couleur="#2563EB" Icon={Coins} sousTitre="Toutes confondues" />
        <KpiPremium titre="Actives" valeur={tontines.filter(t => t.statut === 'ACTIVE').length} couleur="#3B82F6" Icon={Play} sousTitre="En cours" />
        <KpiPremium titre="Volume caisse" valeur={fmt(tontines.reduce((s, t) => s + t.soldeActuelFcfa, 0)) + ' F'} couleur="#8B5CF6" Icon={Banknote} sousTitre="Soldes cumulés" />
        <KpiPremium titre="Transactions" valeur={tontines.reduce((s, t) => s + t._count.transactions, 0)} couleur="#F59E0B" Icon={TrendingUp} sousTitre="Ce chargement" />
      </div>

      <div className="rounded-2xl p-5 flex flex-wrap items-center gap-3"
        style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.07)' }}>
        <Filter size={15} style={{ color: '#64748B' }} />
        {[
          { val: statut, set: (v: string) => { setStatut(v); setPage(1) }, opts: [['','Tous statuts'],['CREATION','En création'],['ACTIVE','Active'],['SUSPENDUE','Suspendue'],['TERMINEE','Terminée']] },
          { val: type,   set: (v: string) => { setType(v);   setPage(1) }, opts: [['','Tous types'],['PERSONNELLE','Personnelle'],['GROUPE','Groupe'],['PROJET','Projet']] },
        ].map((s, i) => (
          <select key={i} value={s.val} onChange={e => s.set(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}>
            {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        {(statut || type) && (
          <button onClick={() => { setStatut(''); setType(''); setPage(1) }}
            className="px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#F1F5F9' }} />)}
        </div>
      ) : tontines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Coins size={48} style={{ color: '#CBD5E1' }} />
          <p className="font-bold" style={{ color: '#94A3B8' }}>Aucune tontine</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {tontines.map(t => {
            const tc = TYPE[t.type] ?? TYPE.PERSONNELLE
            const sc = STATUT[t.statut] ?? STATUT.ACTIVE
            const SI = sc.icon
            const prog = t.objectifMontantFcfa ? Math.min(100, Math.round((t.soldeActuelFcfa / t.objectifMontantFcfa) * 100)) : null

            return (
              <div key={t.id}
                className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden transition-all duration-200"
                style={{ background: `linear-gradient(135deg, ${tc.c}10 0%, #fff 60%)`, border: `1.5px solid ${tc.c}30`, boxShadow: `0 2px 12px ${tc.c}15` }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${tc.c}, ${tc.c}66)` }} />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate" style={{ color: '#0F172A' }}>{t.nom}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{t.proprietaire.nom} · {fmtDate(t.creeLe)}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: sc.bg, color: sc.c }}>
                    <SI size={11} />{sc.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Solde',   val: fmt(t.soldeActuelFcfa) + ' F', c: tc.c },
                    { label: 'Membres', val: t._count.membres,              c: '#3B82F6' },
                    { label: 'Tx',      val: t._count.transactions,         c: '#8B5CF6' },
                  ].map(({ label, val, c }) => (
                    <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: `${c}10`, border: `1px solid ${c}20` }}>
                      <p className="text-sm font-black" style={{ color: c, fontVariantNumeric: 'tabular-nums' }}>{val}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {prog !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#94A3B8' }}>
                      <span>Objectif</span><span style={{ color: tc.c, fontWeight: 700 }}>{prog}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                      <div className="h-full rounded-full" style={{ width: `${prog}%`, background: tc.c }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.c }}>{tc.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>{t.frequence}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>{fmt(t.montantJournalierFcfa)} F/j</span>
                </div>

                <div className="flex gap-2 pt-1 border-t" style={{ borderColor: '#E2E8F0' }}>
                  {t.statut === 'ACTIVE' && (
                    <button onClick={() => doAction(t.id, 'suspendre', 'Suspension')} disabled={actionLoading === t.id + 'suspendre'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <Pause size={12} />{actionLoading === t.id + 'suspendre' ? '...' : 'Suspendre'}
                    </button>
                  )}
                  {t.statut === 'SUSPENDUE' && (
                    <button onClick={() => doAction(t.id, 'reactiver', 'Réactivation')} disabled={actionLoading === t.id + 'reactiver'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center"
                      style={{ background: 'rgba(22,163,74,0.1)', color: '#2563EB', border: '1px solid rgba(22,163,74,0.25)' }}>
                      <Play size={12} />{actionLoading === t.id + 'reactiver' ? '...' : 'Réactiver'}
                    </button>
                  )}
                  {t.statut === 'CREATION' && (
                    <button onClick={() => doAction(t.id, 'activer', 'Activation')} disabled={actionLoading === t.id + 'activer'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <Play size={12} />{actionLoading === t.id + 'activer' ? '...' : 'Activer'}
                    </button>
                  )}
                  {(t.statut === 'ACTIVE' || t.statut === 'SUSPENDUE') && (
                    <button onClick={() => doAction(t.id, 'terminer', 'Clôture')} disabled={actionLoading === t.id + 'terminer'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold justify-center"
                      style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
                      <CheckCircle2 size={12} />{actionLoading === t.id + 'terminer' ? '...' : 'Clôturer'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm" style={{ color: '#64748B' }}>Page {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: '#F1F5F9', color: '#0F172A' }}>← Précédent</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: '#2563EB', color: '#fff' }}>Suivant →</button>
          </div>
        </div>
      )}
    </div>
  )
}
