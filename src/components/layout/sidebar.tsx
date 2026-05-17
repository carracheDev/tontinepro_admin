'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowDownToLine,
  Users,
  Coins,
  CreditCard,
  Scale,
  Banknote,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { logout } from '@/lib/auth'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/retraits',       icon: ArrowDownToLine,  label: 'Retraits' },
  { href: '/utilisateurs',   icon: Users,            label: 'Utilisateurs' },
  { href: '/tontines',       icon: Coins,            label: 'Tontines' },
  { href: '/micro-credits',  icon: CreditCard,       label: 'Micro-crédits' },
  { href: '/litiges',        icon: Scale,            label: 'Litiges' },
  { href: '/commissions',    icon: Banknote,         label: 'Commissions' },
  { href: '/notifications',  icon: Bell,             label: 'Notifications' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
          style={{ background: 'var(--primary)' }}
        >
          T
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm leading-tight">
            TontineBénin<br />
            <span className="text-xs font-normal" style={{ color: 'var(--sidebar-text)' }}>
              Administration
            </span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5 transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
              }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
              {active && !collapsed && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--primary-vif)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion + toggle */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-white/10 transition-all"
          style={{ color: 'var(--sidebar-text)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
