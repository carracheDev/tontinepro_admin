/**
 * Charte de couleurs unifiée TontineBénin Admin Dashboard
 * Source unique de vérité pour tous les styles
 */

export const COLORS = {
  // Palette principale
  primary: '#2563EB',        // Bleu — Marque, actions principales (aligné sur les apps)
  primaryDark: '#1E3A8A',    // Bleu foncé — titres, accents
  success: '#16A34A',        // Vert — états « validé / succès / actif » uniquement
  danger: '#DC2626',         // Rouge — Actions négatives (Rejeter, Erreur, Critique)
  warning: '#F59E0B',        // Orange — Attention (En attente, Important, Seuil)
  info: '#0EA5E9',           // Cyan — Information (Infos, Détails)

  // Texte & Fond
  text: {
    primary: '#0F172A',      // Texte principal (noir)
    secondary: '#6B7280',    // Texte secondaire (gris)
    muted: '#9CA3B8',        // Texte muted (gris clair)
  },

  background: {
    card: '#FFFFFF',         // Fond des cartes
    page: '#F9FAFB',         // Fond de page
    hover: '#F3F4F6',        // Fond au hover
  },

  border: '#E5E7EB',         // Bordure standard

  // Opacity utilities pour les couleurs principales
  opacity: (color: string, opacity: number) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },
} as const

/**
 * Mapping des couleurs par statut/type
 */
export const STATUS_COLORS = {
  RESOLUE: COLORS.success,     // 🟢 Vert
  OUVERTE: COLORS.danger,      // 🔴 Rouge
  EN_ATTENTE: COLORS.warning,  // 🟠 Orange
  EN_COURS: COLORS.warning,    // 🟠 Orange
  SUCCES: COLORS.success,      // 🟢 Vert
  ERREUR: COLORS.danger,       // 🔴 Rouge
} as const

/**
 * Mapping des couleurs par sévérité (Alertes)
 */
export const SEVERITY_COLORS = {
  CRITIQUE: COLORS.danger,     // 🔴 Rouge
  HAUTE: COLORS.warning,       // 🟠 Orange
  MOYENNE: COLORS.info,        // 🔵 Bleu
  BASSE: COLORS.text.secondary, // Gris
} as const

/**
 * Utilitaires pour générer les styles
 */
export const getStatusColor = (status: keyof typeof STATUS_COLORS) => {
  return STATUS_COLORS[status] || COLORS.primary
}

export const getSeverityColor = (severity: keyof typeof SEVERITY_COLORS) => {
  return SEVERITY_COLORS[severity] || COLORS.info
}

/**
 * Styles réutilisables
 */
export const CARD_SHADOW = '0 2px 8px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.05)'
export const CARD_SHADOW_HOVER = (color: string) => `0 12px 32px ${color}18, 0 2px 8px rgba(15,23,42,0.08)`
export const CARD_BORDER = (color: string) => `1px solid ${color}15`
export const CARD_BORDER_HOVER = (color: string) => `1px solid ${color}35`

// Animation standard
export const TRANSITION = 'transition-all duration-300'
