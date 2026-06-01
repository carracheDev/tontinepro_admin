// Tooltip personnalisé réutilisable pour tous les graphiques

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  formatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        background: '#fff',
        border: 'none',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        padding: '10px 14px',
        minWidth: 130,
      }}
    >
      {label && (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>{entry.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString('fr-FR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// Style de conteneur de carte graphique standard
export function ChartCard({
  children,
  titre,
  sousTitre,
  action,
  className = '',
}: {
  children: React.ReactNode
  titre: string
  sousTitre?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl p-6 transition-shadow hover:shadow-lg ${className}`}
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{titre}</h3>
          {sousTitre && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sousTitre}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
