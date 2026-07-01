'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, AlertTriangle, Info,
  User, Phone, ShieldCheck, Star, Wallet, Eye, Search, ThumbsUp, XCircle, ExternalLink,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then((r) => r.data?.donnees ?? r.data)
const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' F'
const dateT = (d?: string) => (d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const dateF = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

type Ctx = {
  litige: { id: string; categorie: string; motif: string; statut: string; resolution?: string | null; creeLe: string; resoluLe?: string | null;
    transaction?: { montantFcfa: number; type: string; statut: string; creeLe: string } | null;
    commentaires: { id: string; auteurId: string; message: string; pieceJointeUrl?: string | null; creeLe: string }[] }
  client: { id: string; nom: string; telephone: string; statut: string; kycVerifie: boolean; score: number; ancienneteMois: number }
  financier: { epargne: number; cotise: number; retire: number; encoursCredit: number }
  anterieurs: { id: string; categorie: string; motif: string; statut: string; creeLe: string }[]
  analyse: { ton: 'positif' | 'neutre' | 'alerte'; texte: string }[]
  reponses: string[]
}

const etatColor = (s: string) => (['RESOLU', 'ACTIF'].includes(s) ? COLORS.success : ['REJETE', 'SUSPENDU', 'BANNI'].includes(s) ? COLORS.danger : COLORS.warning)
function Badge({ text, color }: { text: string; color: string }) {
  return <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: COLORS.opacity(color, 0.12), color }}>{text}</span>
}
function Card({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: COLORS.border }}>
      <div className="mb-3 flex items-center gap-2 text-sm font-black" style={{ color: COLORS.text.primary }}>
        {Icon && <Icon size={16} style={{ color: COLORS.primary }} />} {title}
      </div>
      {children}
    </div>
  )
}

export default function LitigeDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR<Ctx>(id ? `/litiges/${id}/contexte` : null, fetcher)
  const [reply, setReply] = useState('')
  const [resolution, setResolution] = useState('')
  const [motif, setMotif] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; t: string } | null>(null)
  const notify = (ok: boolean, t: string) => { setToast({ ok, t }); setTimeout(() => setToast(null), 3200) }

  async function act(fn: () => Promise<any>, okMsg: string) {
    setBusy(true)
    try { await fn(); await mutate(); notify(true, okMsg) }
    catch (e) { notify(false, extraireErreur(e)) } finally { setBusy(false) }
  }

  if (isLoading) return <div className="p-10 text-center text-gray-400">Chargement du dossier…</div>
  if (!data) return <div className="p-10 text-center text-gray-400">Litige introuvable.</div>

  const { litige: L, client: c, financier: f, analyse, reponses, anterieurs } = data
  const clos = ['RESOLU', 'REJETE'].includes(L.statut)

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-1">
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          style={{ background: toast.ok ? 'rgba(22,163,74,.96)' : 'rgba(220,38,38,.96)' }}>{toast.t}</div>
      )}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Retour aux litiges</button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black" style={{ color: COLORS.text.primary }}>Litige · {L.categorie}</h1>
        <Badge text={L.statut} color={etatColor(L.statut)} />
        <span className="text-sm text-gray-400">ouvert le {dateF(L.creeLe)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ─── COLONNE PRINCIPALE ─── */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Raison du litige" icon={Info}>
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text.primary }}>{L.motif}</p>
            {L.transaction && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border p-2.5 text-sm" style={{ borderColor: COLORS.border, background: COLORS.background.page }}>
                <Wallet size={15} style={{ color: COLORS.primary }} />
                Transaction liée : <b>{L.transaction.type}</b> · {fcfa(L.transaction.montantFcfa)} · <Badge text={L.transaction.statut} color={etatColor(L.transaction.statut)} /> · {dateF(L.transaction.creeLe)}
              </div>
            )}
            {clos && L.resolution && (
              <div className="mt-3 rounded-lg p-2.5 text-sm" style={{ background: COLORS.opacity(etatColor(L.statut), 0.08), color: COLORS.text.primary }}>
                <b>{L.statut === 'RESOLU' ? 'Résolution' : 'Motif du rejet'} :</b> {L.resolution}
              </div>
            )}
          </Card>

          <Card title={`Conversation (${L.commentaires.length})`} icon={MessageSquare}>
            <div className="space-y-3">
              {L.commentaires.length === 0 && <p className="text-sm text-gray-400">Aucun message pour l'instant.</p>}
              {L.commentaires.map((m) => {
                const duClient = m.auteurId === c.id
                return (
                  <div key={m.id} className={`flex ${duClient ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm"
                      style={{ background: duClient ? COLORS.background.page : COLORS.opacity(COLORS.primary, 0.1), color: COLORS.text.primary }}>
                      <div className="mb-0.5 text-[10px] font-bold uppercase" style={{ color: duClient ? COLORS.text.muted : COLORS.primary }}>{duClient ? 'Client' : 'Support'} · {dateT(m.creeLe)}</div>
                      {m.message}
                    </div>
                  </div>
                )
              })}
            </div>

            {!clos && (
              <div className="mt-4 border-t pt-3" style={{ borderColor: COLORS.border }}>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {reponses.map((r, i) => (
                    <button key={i} onClick={() => setReply(r)} className="rounded-full border px-2.5 py-1 text-[11px] font-semibold hover:bg-gray-50"
                      style={{ borderColor: COLORS.border, color: COLORS.text.secondary }} title={r}>
                      💬 Réponse {i + 1}
                    </button>
                  ))}
                </div>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Écrire une réponse (ou choisir un modèle ci-dessus)…"
                  className="w-full rounded-lg border p-2.5 text-sm outline-none" style={{ borderColor: COLORS.border }} />
                <div className="mt-2 flex justify-end">
                  <button disabled={busy || !reply.trim()} onClick={() => act(async () => { await api.post(`/litiges/${id}/commentaire`, { message: reply }); setReply('') }, 'Réponse envoyée.')}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLORS.primary }}>
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ─── COLONNE LATÉRALE ─── */}
        <div className="space-y-4">
          {/* Analyse auto */}
          <div className="rounded-2xl border p-4" style={{ borderColor: COLORS.opacity(COLORS.primary, 0.25), background: COLORS.opacity(COLORS.primary, 0.04) }}>
            <div className="mb-2 text-sm font-black" style={{ color: COLORS.primaryDark }}>🧠 Analyse automatique</div>
            <div className="space-y-1.5">
              {analyse.map((a, i) => {
                const col = a.ton === 'positif' ? COLORS.success : a.ton === 'alerte' ? COLORS.danger : COLORS.text.secondary
                const Ic = a.ton === 'positif' ? CheckCircle2 : a.ton === 'alerte' ? AlertTriangle : Info
                return <div key={i} className="flex items-start gap-2 text-[13px]" style={{ color: COLORS.text.primary }}><Ic size={15} style={{ color: col, marginTop: 1, flexShrink: 0 }} /> {a.texte}</div>
              })}
            </div>
          </div>

          {/* Client */}
          <Card title="Client" icon={User}>
            <div className="space-y-1.5 text-sm" style={{ color: COLORS.text.primary }}>
              <div className="font-bold">{c.nom}</div>
              <div className="flex items-center gap-1 text-gray-500"><Phone size={13} /> {c.telephone}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge text={c.statut} color={etatColor(c.statut)} />
                <Badge text={c.kycVerifie ? 'KYC ✓' : 'KYC ✗'} color={c.kycVerifie ? COLORS.success : COLORS.warning} />
                <Badge text={`Score ${c.score}`} color={COLORS.primary} />
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-2 text-xs text-gray-600">
                <div>Épargne : <b>{fcfa(f.epargne)}</b></div>
                <div>Cotisé : <b>{fcfa(f.cotise)}</b></div>
                <div>Retiré : <b>{fcfa(f.retire)}</b></div>
                <div>Encours : <b>{fcfa(f.encoursCredit)}</b></div>
              </div>
              <Link href={`/utilisateurs/${c.id}`} className="mt-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
                <ExternalLink size={14} /> Voir la fiche 360°
              </Link>
            </div>
          </Card>

          {/* Antérieurs */}
          {anterieurs.length > 0 && (
            <Card title={`Litiges antérieurs (${anterieurs.length})`}>
              <div className="space-y-2">
                {anterieurs.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="flex-1 truncate" style={{ color: COLORS.text.primary }}>{a.categorie} · {dateF(a.creeLe)}</span>
                    <Badge text={a.statut} color={etatColor(a.statut)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Décision */}
          {!clos && (
            <Card title="Décision">
              <button disabled={busy} onClick={() => act(() => api.put(`/litiges/${id}/examiner`), 'Litige passé en examen.')}
                className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-sm font-semibold disabled:opacity-50" style={{ borderColor: COLORS.border, color: COLORS.info }}>
                <Search size={14} /> Marquer « en examen »
              </button>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} placeholder="Résolution (message envoyé au client)…" className="w-full rounded-lg border p-2 text-sm outline-none" style={{ borderColor: COLORS.border }} />
              <button disabled={busy || !resolution.trim()} onClick={() => act(() => api.put(`/litiges/${id}/resoudre`, { resolution }), 'Litige résolu.')}
                className="mb-3 mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLORS.success }}>
                <ThumbsUp size={14} /> Résoudre
              </button>
              <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} placeholder="Motif de rejet…" className="w-full rounded-lg border p-2 text-sm outline-none" style={{ borderColor: COLORS.border }} />
              <button disabled={busy || !motif.trim()} onClick={() => act(() => api.put(`/litiges/${id}/rejeter`, { motifRejet: motif }), 'Litige rejeté.')}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLORS.danger }}>
                <XCircle size={14} /> Rejeter
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
