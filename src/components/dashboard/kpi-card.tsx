import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

interface KpiCardProps {
  titre: string
  valeur: string | number
  icone: LucideIcon
  couleur?: string
  couleurFond?: string          // fond de l'icône (optionnel, sinon déduit de couleur)
  badge?: string
  badgeCouleur?: string
  sousTitre?: string
  tendance?: number             // % vs période précédente
  href?: string
  accentTop?: boolean           // bande colorée en haut (défaut: true)
}

export default function KpiCard({
  titre,
  valeur,
  icone: Icon,
  couleur = '#16A34A',
  couleurFond,
  badge,
  badgeCouleur,
  sousTitre,
  tendance,
  href,
  accentTop = true,
}: KpiCardProps) {
  const iconBg = couleurFond ?? couleur + '18'
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
      className="relative rounded-2xl p-5 flex flex-col gap-4 h-full overflow-hidden transition-all duration-200"
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 16px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 1px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Bande colorée en haut */}
      {accentTop && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${couleur}, ${couleur}88)` }}
        />
      )}

      {/* Watermark icon décoratif en fond */}
      <div
        className="absolute -right-3 -bottom-3 opacity-[0.04]"
        style={{ transform: 'rotate(-15deg)' }}
      >
        <Icon size={80} />
      </div>

      {/* Icône + badge */}
      <div className="flex items-start justify-between mt-1">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: iconBg,
            boxShadow: `0 2px 8px ${couleur}30`,
          }}
        >
          <Icon size={20} style={{ color: couleur }} />
        </div>
        {badge && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: `${badgeColor}15`,
              color: badgeColor,
              border: `1px solid ${badgeColor}30`,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Valeur + titre + tendance */}
      <div className="relative z-10">
        <div className="flex items-end gap-2 flex-wrap">
          <p
            className="text-2xl font-black leading-none tracking-tight"
            style={{
              color: 'var(--foreground)',
              fontVariantNumeric: 'tabular-nums',
            }}
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
        <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--muted)' }}>
          {titre}
        </p>
        {sousTitre && (
          <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--muted)' }}>
            {sousTitre}
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}
