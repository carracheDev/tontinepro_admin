'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import {
  ShieldCheck, ShieldX, Clock, CheckCircle2,
  XCircle, ExternalLink, FileText,
} from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import KpiCard from '@/components/dashboard/kpi-card'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

type DocKyc = {
  id: string
  typeDocument: string
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'
  urlDocument?: string
  creeLe: string
  utilisateur?: { id: string; nom: string; telephone: string }
}

const TYPE_LABEL: Record<string, string> = {
  CNI: 'Carte CIP', PASSEPORT: 'Passeport',
  PERMIS: 'Permis de conduire', ACTE_NAISSANCE: 'Acte de naissance',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function typeFichierKyc(url?: string): 'image' | 'pdf' | 'autre' {
  if (!url) return 'autre'

  const lower = url.toLowerCase()
  const path = lower.split(/[?#]/)[0]

  if (lower.startsWith('data:image/')) return 'image'
  if (lower.startsWith('data:application/pdf')) return 'pdf'
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(path)) return 'image'
  if (/\.pdf$/.test(path) || lower.includes('application/pdf')) return 'pdf'

  return 'autre'
}

// ─── Modal Viewer de documents ────────────────────────────────────────────────
function ModalViewer({
  doc,
  onClose,
  onValider,
  onRejeterClick,
  loadingId
}: {
  doc: DocKyc
  onClose: () => void
  onValider: (id: string) => void
  onRejeterClick: (id: string) => void
  loadingId: string | null
}) {
  const [zoom, setZoom] = useState(100)
  const [fullscreen, setFullscreen] = useState(false)

  const typeFichier = typeFichierKyc(doc.urlDocument)
  const isImage = typeFichier === 'image'
  const isPdf = typeFichier === 'pdf'
  const pdfSrc = doc.urlDocument?.startsWith('data:')
    ? doc.urlDocument
    : `${doc.urlDocument}#toolbar=0`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-4xl rounded-3xl p-6 space-y-6" style={{ background: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black" style={{ color: '#0F172A' }}>
              Vérification KYC
            </h2>
            <p className="text-sm mt-2" style={{ color: '#9CA3B8' }}>
              Examinez le document avant validation
            </p>
          </div>
          <button onClick={onClose} className="text-2xl" style={{ color: '#9CA3B8' }}>
            ✕
          </button>
        </div>

        {/* Client Info */}
        <div className="rounded-2xl p-5" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#6B7280' }}>Client</p>
              <p className="text-base font-black mt-1" style={{ color: '#0F172A' }}>
                {doc.utilisateur?.nom ?? 'Inconnu'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#6B7280' }}>Type</p>
              <p className="text-base font-black mt-1" style={{ color: '#0F172A' }}>
                {TYPE_LABEL[doc.typeDocument] ?? doc.typeDocument}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#6B7280' }}>Soumis le</p>
              <p className="text-sm font-black mt-1" style={{ color: '#0F172A' }}>
                {fmtDate(doc.creeLe)}
              </p>
            </div>
          </div>
        </div>

        {/* Document Viewer avec Zoom */}
        <div className="rounded-2xl border-2 flex flex-col" style={{ borderColor: '#E5E7EB', minHeight: '600px', background: '#F9FAFB' }}>
          {/* Toolbar zoom - seulement pour images */}
          {isImage && (
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#2563EB', color: '#fff' }}>− Zoom</button>
              <span className="text-xs font-bold" style={{ color: '#6B7280', minWidth: '50px', textAlign: 'center' }}>{zoom}%</span>
              <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#2563EB', color: '#fff' }}>+ Zoom</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setFullscreen(!fullscreen)} className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#3B82F6', color: '#fff' }}>⛶ {fullscreen ? 'Normal' : 'Fullscreen'}</button>
            </div>
          )}

          {/* Contenu */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            {doc.urlDocument ? (
              <>
                {isImage ? (
                  <img src={doc.urlDocument} alt="Document KYC" className="rounded-xl object-contain" style={{ width: `${zoom}%`, maxHeight: '100%' }} />
                ) : isPdf ? (
                  <div className="w-full space-y-3">
                    <object
                      data={pdfSrc}
                      type="application/pdf"
                      className="rounded-xl w-full"
                      style={{ border: 'none', minHeight: '560px', background: '#fff' }}
                    >
                      <iframe
                        src={pdfSrc}
                        title="Document KYC PDF"
                        className="rounded-xl w-full"
                        style={{ border: 'none', minHeight: '560px', background: '#fff' }}
                      />
                    </object>
                    <div className="flex items-center justify-center">
                      <a
                        href={doc.urlDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                        style={{ color: '#fff', background: '#3B82F6' }}
                      >
                        <ExternalLink size={14} />
                        Ouvrir le PDF dans un nouvel onglet
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText size={48} style={{ color: '#9CA3B8', marginBottom: '1rem' }} />
                    <p style={{ color: '#9CA3B8' }}>Document non-visualisable</p>
                    <a href={doc.urlDocument} target="_blank" rel="noreferrer" className="text-sm font-bold mt-3 inline-block" style={{ color: '#2563EB' }}>Ouvrir dans un nouvel onglet →</a>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: '#9CA3B8' }}>Aucun fichier disponible</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onRejeterClick(doc.id)}
            disabled={loadingId === doc.id}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{
              background: '#FECACA',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            <XCircle size={18} />
            Rejeter
          </button>
          <button
            onClick={() => onValider(doc.id)}
            disabled={loadingId === doc.id}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 ml-auto"
            style={{ background: '#2563EB' }}
          >
            <CheckCircle2 size={18} />
            {loadingId === doc.id ? 'Traitement…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Motif de rejet ─────────────────────────────────────────────────────
function ModalRejet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (m: string) => void }) {
  const [motif, setMotif] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#fff' }}>
        <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Motif de rejet KYC</h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Le client recevra une notification <strong>FCM + SMS + in-app</strong>.
        </p>
        <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3}
          placeholder="Ex : Document illisible, photo floue, document expiré..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1.5px solid var(--border)' }} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F3F4F6', color: 'var(--muted)' }}>Annuler</button>
          <button onClick={() => motif.trim() && onConfirm(motif.trim())}
            disabled={!motif.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--danger)' }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

export default function KycPage() {
  const { data, mutate, isLoading } = useSWR('/kyc/en-attente', fetcher, { refreshInterval: 60_000 })
  const { data: dashData } = useSWR('/analytics/dashboard', fetcher, { refreshInterval: 120_000 })

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejetId, setRejetId] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const docs: DocKyc[] = Array.isArray(data) ? data : data?.documents ?? []
  const kycStats: { label: string; valeur: number }[] = dashData?.graphiques?.kycParStatut ?? []

  const valides   = kycStats.find(s => s.label === 'VALIDE')?.valeur ?? 0
  const enAttente = kycStats.find(s => s.label === 'EN_ATTENTE')?.valeur ?? 0
  const rejetes   = kycStats.find(s => s.label === 'REJETE')?.valeur ?? 0
  const total     = valides + enAttente + rejetes

  const pieData = [
    { name: 'Validés', value: valides },
    { name: 'En attente', value: enAttente },
    { name: 'Rejetés', value: rejetes },
  ].filter(d => d.value > 0)

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  async function valider(id: string) {
    setLoadingId(id)
    try {
      await api.put(`/kyc/${id}/valider`)
      showToast('ok', '✅ Document validé — FCM + SMS + in-app envoyés')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  async function rejeter(id: string, motif: string) {
    setRejetId(null)
    setLoadingId(id)
    try {
      await api.put(`/kyc/${id}/rejeter`, { motifRejet: motif })
      showToast('err', '❌ Document rejeté — client notifié')
      mutate()
    } catch (err) { showToast('err', extraireErreur(err)) }
    finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-6 max-w-350">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {toast.text}
        </div>
      )}
      {rejetId && <ModalRejet onClose={() => setRejetId(null)} onConfirm={m => rejeter(rejetId, m)} />}
      {viewerId && (
        <ModalViewer
          doc={docs.find(d => d.id === viewerId)!}
          onClose={() => setViewerId(null)}
          onValider={(id) => { setViewerId(null); valider(id); }}
          onRejeterClick={(id) => { setViewerId(null); setRejetId(id); }}
          loadingId={loadingId}
        />
      )}

      {/* KPIs + camembert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard titre="Documents total" valeur={total} icone={FileText} couleur="var(--primary)" />
            <KpiCard titre="En attente" valeur={enAttente} icone={Clock}
              couleur="var(--warning)" badge={enAttente > 0 ? `${enAttente}` : undefined} badgeCouleur="var(--warning)" />
            <KpiCard titre="Taux validation" valeur={total > 0 ? `${Math.round(valides / total * 100)}%` : '—'} icone={ShieldCheck} couleur="var(--primary)" />
          </div>

          {/* File en attente */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <Clock size={16} style={{ color: 'var(--warning)' }} />
              <h2 className="font-bold text-sm flex-1" style={{ color: 'var(--foreground)' }}>
                Documents en attente de vérification
              </h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>refresh 60s</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <Clock size={18} className="animate-spin" /> Chargement…
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--muted)' }}>
                <ShieldCheck size={36} className="mb-2 opacity-30" />
                <p className="font-semibold text-sm">Aucun document en attente</p>
              </div>
            ) : (
              <div>
                {docs.map((doc, i) => (
                  <div key={doc.id} className="px-5 py-4" style={{ borderBottom: i < docs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(217,119,6,0.1)' }}>
                        <Clock size={18} style={{ color: 'var(--warning)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                          {doc.utilisateur?.nom ?? 'Client inconnu'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {doc.utilisateur?.telephone} · {TYPE_LABEL[doc.typeDocument] ?? doc.typeDocument}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fmtDate(doc.creeLe)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setViewerId(doc.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <FileText size={14} />
                        Examiner document
                      </button>
                      <button onClick={() => setRejetId(doc.id)} disabled={loadingId === doc.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                        style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)' }}>
                        <XCircle size={14} /> Rejeter
                      </button>
                      <button onClick={() => valider(doc.id)} disabled={loadingId === doc.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                        style={{ background: 'var(--primary)' }}>
                        <CheckCircle2 size={14} />
                        {loadingId === doc.id ? 'Traitement…' : 'Valider'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Camembert statuts */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Répartition KYC
          </h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={['#2563EB', '#D97706', '#DC2626'][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v, n) => [`${v} (${Math.round(Number(v) / total * 100)}%)`, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--muted)' }}>
              <ShieldX size={32} className="opacity-30" />
            </div>
          )}
          <div className="space-y-2 mt-2">
            {[
              { label: 'Validés', val: valides, color: '#2563EB' },
              { label: 'En attente', val: enAttente, color: '#D97706' },
              { label: 'Rejetés', val: rejetes, color: '#DC2626' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                </div>
                <span className="font-bold" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
