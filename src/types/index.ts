export interface Utilisateur {
  id: string
  nom: string
  telephone: string
  role: string
  statut: string
  creeLe: string
  scoreCredit?: number
}

export interface Tontine {
  id: string
  nom: string
  type: string
  statut: string
  soldeActuel: number
  nombreMembres: number
  creeLe: string
}

export interface Transaction {
  id: string
  type: string
  montant: number
  statut: string
  creeLe: string
  utilisateur?: { nom: string; telephone: string }
}

export interface Retrait {
  id: string
  montant: number
  statut: string
  creeLe: string
  utilisateur: { nom: string; telephone: string }
  tontine: { nom: string }
  operateur?: string
}

export interface MicroCredit {
  id: string
  montantDemande: number
  statut: string
  creeLe: string
  client: { nom: string; telephone: string }
  tauxInteret: number
  dureeEnMois: number
}

export interface Litige {
  id: string
  sujet: string
  description: string
  statut: string
  creeLe: string
  auteur: { nom: string; telephone: string }
}

export interface KpiDashboard {
  totalClients: number
  totalCollecteurs: number
  totalTontines: number
  soldeTotal: number
  transactionsDuJour: number
  retraitsEnAttente: number
  creditsActifs: number
  litigesOuverts: number
}
