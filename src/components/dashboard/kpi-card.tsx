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
  tendance?: number
  href?: string
}

export default function KpiCard({
  titre,
  valeur,
  icone: Icon,
  couleur = '#2563EB',
  badge,
  badgeCouleur,
  sousTitre,
  tendance,
  href,
}: KpiCardProps) {
  const badgeColor = badgeCouleur ?? couleur

  const trendColor =
    tendance == null ? '' :
    tendance > 0 ? '#16A34A' :
    tendance < 0 ? '#EF4444' : '#6B7280'

  const TrendIcon =
    tendance == null ? null :
    tendance > 0 ? TrendingUp :
    tendance < 0 ? TrendingDown : Minus

  const inner = (
    <div
      className="card-hover relative rounded-2xl p-5 flex flex-col gap-4 h-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${couleur}14 0%, ${couleur}06 100%)`,
        border: `1.5px solid ${couleur}2A`,
        boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      }}
    >
      {/* Barre colorée en haut */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: couleur }} />
      {/* Cercle décoratif */}
      <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full" style={{ background: `${couleur}12` }} />

      {/* Icône + badge */}
      <div className="flex items-start justify-between mt-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${couleur}1F`, border: `1px solid ${couleur}33` }}
        >
          <Icon size={20} style={{ color: couleur }} />
        </div>
        {badge && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: `${badgeColor}1A`, color: badgeColor, border: `1px solid ${badgeColor}40` }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Valeur + titre */}
      <div className="relative z-10">
        <div className="flex items-end gap-2 flex-wrap">
          <p className="text-2xl font-black leading-none tracking-tight"
            style={{ color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {valeur}
          </p>
          {TrendIcon && tendance != null && (
            <span className="flex items-center gap-0.5 text-xs font-bold pb-0.5" style={{ color: trendColor }}>
              <TrendIcon size={12} />
              {Math.abs(tendance)}%
            </span>
          )}
        </div>
        <p className="text-xs font-bold mt-1.5" style={{ color: couleur }}>{titre}</p>
        {sousTitre && <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{sousTitre}</p>}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}
