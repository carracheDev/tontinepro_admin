import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

interface KpiCardProps {
  titre: string
  valeur: string | number
  icone: LucideIcon
  couleur?: string
  badge?: string
  badgeCouleur?: string
  sousTitre?: string
  tendance?: number       // % vs mois précédent, undefined = pas de comparaison
  href?: string
}

export default function KpiCard({
  titre,
  valeur,
  icone: Icon,
  couleur = 'var(--primary)',
  badge,
  badgeCouleur = 'var(--primary)',
  sousTitre,
  tendance,
  href,
}: KpiCardProps) {
  const trendColor =
    tendance == null ? '' :
    tendance > 0 ? '#16A34A' :
    tendance < 0 ? '#DC2626' : '#6B7280'

  const TrendIcon =
    tendance == null ? null :
    tendance > 0 ? TrendingUp :
    tendance < 0 ? TrendingDown : Minus

  const inner = (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 h-full transition-shadow hover:shadow-md"
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${couleur}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icône + badge */}
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${couleur}18` }}
        >
          <Icon size={18} style={{ color: couleur }} />
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

      {/* Valeur + tendance */}
      <div>
        <div className="flex items-end gap-2">
          <p
            className="text-2xl font-black leading-none"
            style={{ color: 'var(--foreground)', fontFamily: "'Inter', sans-serif", fontVariantNumeric: 'tabular-nums' }}
          >
            {valeur}
          </p>
          {TrendIcon && tendance != null && (
            <span
              className="flex items-center gap-0.5 text-xs font-bold pb-0.5"
              style={{ color: trendColor }}
            >
              <TrendIcon size={12} />
              {Math.abs(tendance)}%
            </span>
          )}
        </div>
        <p className="text-xs font-medium mt-1" style={{ color: 'var(--muted)' }}>
          {titre}
        </p>
        {sousTitre && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>
            {sousTitre}
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block">{inner}</Link> : inner
}
