'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const PAGES: Record<string, { titre: string; sous: string }> = {
  '/dashboard':     { titre: 'Dashboard',           sous: 'Vue d\'ensemble de la plateforme' },
  '/retraits':      { titre: 'Retraits',             sous: 'Validation des retraits ≥ 50 000 FCFA' },
  '/utilisateurs':  { titre: 'Utilisateurs',         sous: 'Clients et collecteurs inscrits' },
  '/tontines':      { titre: 'Tontines',             sous: 'Gestion des tontines actives' },
  '/micro-credits': { titre: 'Micro-crédits',        sous: 'Demandes et remboursements' },
  '/litiges':       { titre: 'Litiges',              sous: 'Conflits et réclamations ouverts' },
  '/commissions':   { titre: 'Commissions',          sous: 'Historique des commissions agents' },
  '/notifications': { titre: 'Notifications push',  sous: 'Envoi de messages aux utilisateurs' },
}

export default function Header() {
  const pathname = usePathname()
  const page = PAGES[pathname] ?? { titre: 'Administration', sous: 'TontineBénin' }

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
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {page.sous}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicateur live */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'var(--primary-light)', border: '1px solid #BBF7D0' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Live</span>
        </div>

        {/* Cloche */}
        <button className="relative p-2 rounded-xl transition-colors hover:bg-gray-100">
          <Bell size={18} style={{ color: 'var(--muted)' }} />
        </button>

        {/* Avatar admin */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          A
        </div>
      </div>
    </header>
  )
}
