import { type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  titre: string
  valeur: string | number
  icone: LucideIcon
  couleur?: string
  badge?: string
  badgeCouleur?: string
  sousTitre?: string
}

export default function KpiCard({
  titre,
  valeur,
  icone: Icon,
  couleur = 'var(--primary)',
  badge,
  badgeCouleur = 'var(--primary)',
  sousTitre,
}: KpiCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${couleur}18` }}
        >
          <Icon size={20} style={{ color: couleur }} />
        </div>
        {badge && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${badgeCouleur}18`, color: badgeCouleur }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>
          {valeur}
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
          {titre}
        </p>
        {sousTitre && (
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {sousTitre}
          </p>
        )}
      </div>
    </div>
  )
}
