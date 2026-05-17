'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/retraits':      'Retraits en attente',
  '/utilisateurs':  'Utilisateurs',
  '/tontines':      'Tontines',
  '/micro-credits': 'Micro-crédits',
  '/litiges':       'Litiges',
  '/commissions':   'Commissions',
  '/notifications': 'Notifications push',
}

export default function Header() {
  const pathname = usePathname()
  const title = TITLES[pathname] ?? 'Administration'

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        height: 64,
      }}
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all">
          <Bell size={20} style={{ color: 'var(--muted)' }} />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'var(--primary)' }}
        >
          A
        </div>
      </div>
    </header>
  )
}
