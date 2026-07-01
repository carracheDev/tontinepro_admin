'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowDownToLine, Users, Coins,
  CreditCard, Scale, Banknote, Bell, LogOut,
  ChevronLeft, ChevronRight, ShieldCheck, FileText,
  UserCheck, MapPin, AlertTriangle, ClipboardList, BarChart3,
  Receipt, Settings, Inbox, Activity,
} from 'lucide-react'
import { logout } from '@/lib/auth'
import { useState } from 'react'

const NAV_GROUPS = [
  {
    label: 'Vue générale',
    items: [
      { href: '/action-center', icon: Inbox,           label: "Centre d'action", badge: '★' },
      { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/alertes',       icon: AlertTriangle,   label: 'Alertes',      badge: 'LIVE' },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { href: '/retraits',      icon: ArrowDownToLine, label: 'Retraits',     badge: '!' },
      { href: '/micro-credits', icon: CreditCard,      label: 'Micro-crédits' },
      { href: '/kyc',           icon: ShieldCheck,     label: 'KYC' },
      { href: '/padme',         icon: FileText,        label: 'PADME' },
      { href: '/litiges',       icon: Scale,           label: 'Litiges' },
    ],
  },
  {
    label: 'Personnes',
    items: [
      { href: '/utilisateurs',  icon: Users,           label: 'Utilisateurs' },
      { href: '/collecteurs',   icon: UserCheck,       label: 'Collecteurs' },
      { href: '/zones',         icon: MapPin,          label: 'Zones' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { href: '/transactions',  icon: Receipt,         label: 'Transactions' },
      { href: '/tontines',      icon: Coins,           label: 'Tontines' },
      { href: '/commissions',   icon: Banknote,        label: 'Commissions' },
    ],
  },
  {
    label: 'Système',
    items: [
      { href: '/sante',         icon: Activity,        label: 'Santé système' },
      { href: '/rapports',      icon: BarChart3,       label: 'Rapports' },
      { href: '/audit',         icon: ClipboardList,   label: 'Audit' },
      { href: '/notifications', icon: Bell,            label: 'Notifications' },
      { href: '/parametres',    icon: Settings,        label: 'Paramètres' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 64 : 224,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-white text-sm"
          style={{ background: 'var(--primary)' }}
        >
          T
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm leading-tight">
            TontineBénin<br />
            <span className="text-xs font-normal opacity-60">Administration</span>
          </span>
        )}
      </div>

      {/* Nav groupée */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-4 mb-1 text-xs font-bold uppercase tracking-widest opacity-40 text-white">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, icon: Icon, label, badge }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg mb-0.5 transition-all group"
                  style={{
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{label}</span>
                      {badge === 'LIVE' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      )}
                      {badge === '!' && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(217,119,6,0.25)', color: '#FCD34D' }}>
                          ●
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bas */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg hover:bg-white/10 transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  )
}
