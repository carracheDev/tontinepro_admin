'use client'

import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { Bell, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { GlobalSearch } from '@/components/global-search'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

const PAGES: Record<string, { titre: string; sous: string }> = {
  '/dashboard':     { titre: 'Dashboard',           sous: 'Vue d\'ensemble temps réel' },
  '/retraits':      { titre: 'Retraits',             sous: 'Validation des retraits ≥ 50 000 FCFA' },
  '/utilisateurs':  { titre: 'Utilisateurs',         sous: 'Clients, agents et superviseurs' },
  '/tontines':      { titre: 'Tontines',             sous: 'Gestion des tontines actives' },
  '/micro-credits': { titre: 'Micro-crédits',        sous: 'Demandes et suivi du portefeuille' },
  '/litiges':       { titre: 'Litiges',              sous: 'Conflits et réclamations' },
  '/commissions':   { titre: 'Commissions',          sous: 'Historique des commissions agents' },
  '/notifications': { titre: 'Notifications',        sous: 'Diffusion de messages push' },
  '/kyc':           { titre: 'Vérification KYC',     sous: 'Documents en attente de validation' },
  '/padme':         { titre: 'Dossiers PADME',       sous: 'Suivi des dossiers crédit PADME' },
  '/collecteurs':   { titre: 'Collecteurs',          sous: 'Performance et ranking terrain' },
  '/zones':         { titre: 'Zones',                sous: 'Répartition géographique des clients' },
  '/alertes':       { titre: 'Alertes système',      sous: 'Circuit breaker, fraude, incidents' },
  '/rapports':      { titre: 'Rapports & Exports',   sous: 'Téléchargement CSV et PDF' },
  '/audit':         { titre: 'Journal d\'audit',     sous: 'Traçabilité de toutes les actions admin' },
}

export default function Header() {
  const pathname = usePathname()
  // Normalise les sous-routes (/utilisateurs/xyz → /utilisateurs)
  const baseRoute = '/' + (pathname.split('/')[1] ?? '')
  const page = PAGES[baseRoute] ?? { titre: 'Administration', sous: 'TontineBénin' }

  const { data: nonLues } = useSWR('/notifications/non-lues', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  const nbNonLues: number = typeof nonLues === 'number' ? nonLues : nonLues?.count ?? 0

  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        height: 64,
        minHeight: 64,
      }}
    >
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
          {page.titre}
        </h1>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{page.sous}</p>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />
        {/* Live indicator (vert = statut « en ligne ») */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,163,74,0.08)', border: '1px solid #BFDBFE' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Live</span>
        </div>

        {/* Cloche avec badge */}
        <button className="relative p-2 rounded-xl transition-colors hover:bg-gray-100">
          <Bell size={18} style={{ color: 'var(--muted)' }} />
          {nbNonLues > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ background: 'var(--danger)', fontSize: 9 }}>
              {nbNonLues > 9 ? '9+' : nbNonLues}
            </span>
          )}
        </button>

        {/* Avatar admin */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer"
          style={{ background: 'var(--primary)' }}
          title="Admin"
        >
          A
        </div>
      </div>
    </header>
  )
}
