import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

interface KpiCardProps {
  titre: string
  valeur: string | number
  icone: LucideIcon
  couleur?: string
  couleurFond?: string
  badge?: string
  badgeCouleur?: string
  sousTitre?: string
  tendance?: number
  href?: string
  accentTop?: boolean
}

export default function KpiCard({
  titre,
  valeur,
  icone: Icon,
  couleur = '#16A34A',
  badge,
  badgeCouleur,
  sousTitre,
  tendance,
  href,
}: KpiCardProps) {
  const badgeColor = badgeCouleur ?? couleur

  const trendColor =
    tendance == null ? '' :
    tendance > 0  ? '#16A34A' :
    tendance < 0  ? '#EF4444' : '#6B7280'

  const TrendIcon =
    tendance == null ? null :
    tendance > 0  ? TrendingUp :
    tendance < 0  ? TrendingDown : Minus

  const inner = (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-4 h-full overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${couleur}18 0%, ${couleur}08 100%)`,
        border: `1.5px solid ${couleur}35`,
        boxShadow: `0 4px 16px ${couleur}20, 0 1px 4px rgba(15,23,42,0.08)`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = `0 8px 28px ${couleur}35, 0 2px 8px rgba(15,23,42,0.12)`
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = `0 4px 16px ${couleur}20, 0 1px 4px rgba(15,23,42,0.08)`
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Barre colorée en haut */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${couleur}, ${couleur}88)` }}
      />

      {/* Cercle décoratif fond */}
      <div
        className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full"
        style={{ background: `${couleur}18` }}
      />

      {/* Icône + badge */}
      <div className="flex items-start justify-between mt-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${couleur}25`,
            border: `1px solid ${couleur}40`,
          }}
        >
          <Icon size={20} style={{ color: couleur }} />
        </div>
        {badge && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: `${badgeColor}20`,
              color: badgeColor,
              border: `1px solid ${badgeColor}50`,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Valeur + titre */}
      <div className="relative z-10">
        <div className="flex items-end gap-2 flex-wrap">
          <p
            className="text-2xl font-black leading-none tracking-tight"
            style={{ color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}
          >
            {valeur}
          </p>
          {TrendIcon && tendance != null && (
            <span className="flex items-center gap-0.5 text-xs font-bold pb-0.5" style={{ color: trendColor }}>
              <TrendIcon size={12} />
              {Math.abs(tendance)}%
            </span>
          )}
        </div>
        <p className="text-xs font-bold mt-1.5" style={{ color: couleur }}>
          {titre}
        </p>
        {sousTitre && (
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            {sousTitre}
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}
