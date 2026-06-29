'use client'

import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import {
  Download, FileText, FileSpreadsheet,
  BarChart3, Users, CreditCard, ArrowDownToLine, CheckCircle2,
} from 'lucide-react'

type Rapport = {
  id: string
  titre: string
  description: string
  icon: typeof FileText
  couleur: string
  bg: string
  endpoint: string
  format: 'CSV' | 'PDF'
  filename: string
}

const RAPPORTS: Rapport[] = [
  {
    id: 'tx-csv', titre: 'Transactions CSV', format: 'CSV',
    description: 'Toutes les cotisations et retraits avec montants, statuts et opérateurs.',
    icon: FileSpreadsheet, couleur: '#2563EB', bg: 'rgba(22,163,74,0.08)',
    endpoint: '/rapports/exports/transactions.csv', filename: 'transactions.csv',
  },
  {
    id: 'retraits-csv', titre: 'Retraits CSV', format: 'CSV',
    description: 'Historique complet des retraits validés, rejetés et en attente.',
    icon: FileSpreadsheet, couleur: '#D97706', bg: 'rgba(217,119,6,0.08)',
    endpoint: '/rapports/exports/retraits.csv', filename: 'retraits.csv',
  },
  {
    id: 'credits-csv', titre: 'Micro-crédits CSV', format: 'CSV',
    description: 'Portefeuille de micro-crédits avec taux de remboursement et statuts.',
    icon: FileSpreadsheet, couleur: '#7C3AED', bg: 'rgba(124,58,237,0.08)',
    endpoint: '/rapports/exports/micro-credits.csv', filename: 'micro-credits.csv',
  },
  {
    id: 'financier-pdf', titre: 'Rapport financier PDF', format: 'PDF',
    description: 'Synthèse financière mensuelle : revenus, commissions, marges.',
    icon: BarChart3, couleur: '#0284C7', bg: 'rgba(2,132,199,0.08)',
    endpoint: '/rapports/financier.pdf', filename: 'rapport-financier.pdf',
  },
  {
    id: 'credits-pdf', titre: 'Rapport micro-crédits PDF', format: 'PDF',
    description: 'Analyse du portefeuille crédit : encours, défauts, taux de remboursement.',
    icon: CreditCard, couleur: '#7C3AED', bg: 'rgba(124,58,237,0.08)',
    endpoint: '/rapports/micro-credits.pdf', filename: 'rapport-micro-credits.pdf',
  },
  {
    id: 'agents-pdf', titre: 'Rapport collecteurs PDF', format: 'PDF',
    description: 'Performance des agents terrain : volume collecté, commissions, clients.',
    icon: Users, couleur: '#2563EB', bg: 'rgba(22,163,74,0.08)',
    endpoint: '/rapports/agents.pdf', filename: 'rapport-collecteurs.pdf',
  },
  {
    id: 'bilan-pdf', titre: 'Bilan comptable PDF', format: 'PDF',
    description: 'Bilan complet de la plateforme pour la direction et les partenaires.',
    icon: FileText, couleur: '#1F2937', bg: 'rgba(31,41,55,0.06)',
    endpoint: '/rapports/bilan.pdf', filename: 'bilan.pdf',
  },
  {
    id: 'retraits-en-attente', titre: 'Retraits en attente PDF', format: 'PDF',
    description: 'Liste des retraits ≥ 50 000 FCFA en attente de validation admin.',
    icon: ArrowDownToLine, couleur: '#D97706', bg: 'rgba(217,119,6,0.08)',
    endpoint: '/rapports/retraits-en-attente.pdf', filename: 'retraits-en-attente.pdf',
  },
]

export default function RapportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [successes, setSuccesses] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function telecharger(rapport: Rapport) {
    setLoading(rapport.id)
    setErrors(prev => { const n = { ...prev }; delete n[rapport.id]; return n })
    try {
      const contentType = rapport.format === 'PDF' ? 'application/pdf' : 'text/csv'
      const res = await api.get(rapport.endpoint, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: contentType }))
      const a = document.createElement('a')
      a.href = url; a.download = rapport.filename; a.click()
      URL.revokeObjectURL(url)
      setSuccesses(prev => new Set([...prev, rapport.id]))
      setTimeout(() => setSuccesses(prev => { const n = new Set(prev); n.delete(rapport.id); return n }), 3000)
    } catch (err) {
      setErrors(prev => ({ ...prev, [rapport.id]: extraireErreur(err) }))
    } finally {
      setLoading(null)
    }
  }

  const csv = RAPPORTS.filter(r => r.format === 'CSV')
  const pdf = RAPPORTS.filter(r => r.format === 'PDF')

  return (
    <div className="space-y-8 max-w-350">
      {/* Header informatif */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'var(--primary-light)', border: '1px solid #BFDBFE' }}>
        <Download size={22} style={{ color: 'var(--primary)', marginTop: 2 }} />
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>Exports disponibles à la demande</p>
          <p className="text-sm mt-1" style={{ color: 'var(--primary)', opacity: 0.8 }}>
            Tous les fichiers sont générés en temps réel depuis la base de données.
            Les CSV s&apos;ouvrent dans Excel/LibreOffice, les PDF sont prêts à imprimer.
          </p>
        </div>
      </div>

      {/* CSV */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
          Exports CSV — tableur
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {csv.map(r => <RapportCard key={r.id} rapport={r} loading={loading === r.id}
            success={successes.has(r.id)} error={errors[r.id]} onDownload={() => telecharger(r)} />)}
        </div>
      </div>

      {/* PDF */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
          Rapports PDF — direction & partenaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdf.map(r => <RapportCard key={r.id} rapport={r} loading={loading === r.id}
            success={successes.has(r.id)} error={errors[r.id]} onDownload={() => telecharger(r)} />)}
        </div>
      </div>
    </div>
  )
}

function RapportCard({ rapport, loading, success, error, onDownload }: {
  rapport: Rapport
  loading: boolean
  success: boolean
  error?: string
  onDownload: () => void
}) {
  const Icon = rapport.icon
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{ background: '#fff', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: rapport.bg }}>
          <Icon size={20} style={{ color: rapport.couleur }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{rapport.titre}</p>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: rapport.format === 'CSV' ? 'rgba(22,163,74,0.1)' : 'rgba(2,132,199,0.1)', color: rapport.format === 'CSV' ? '#2563EB' : '#0284C7' }}>
              {rapport.format}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{rapport.description}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <button onClick={onDownload} disabled={loading}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 mt-auto"
        style={{ background: success ? '#2563EB' : rapport.couleur, color: '#fff' }}>
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération…</>
        ) : success ? (
          <><CheckCircle2 size={16} /> Téléchargé !</>
        ) : (
          <><Download size={16} /> Télécharger</>
        )}
      </button>
    </div>
  )
}
