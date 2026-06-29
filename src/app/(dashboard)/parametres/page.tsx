'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, extraireErreur } from '@/lib/api'
import {
  Settings, Percent, CreditCard, Shield, Bell,
  AlertTriangle, Clock, Save, ToggleLeft, ToggleRight,
  CheckCircle2, RefreshCw,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data?.donnees ?? r.data)

// ─── Types ────────────────────────────────────────────────────────────────────
type Parametre = {
  cle: string
  valeur: string
  description: string
  modifiePar: string | null
  misAJourLe: string | null
  estValeurParDefaut: boolean
}

// ─── Config groupes ───────────────────────────────────────────────────────────
const GROUPES = [
  {
    label: 'Commissions & Taux',
    icon: Percent,
    couleur: '#2563EB',
    cles: ['TAUX_COMMISSION_COTISATION', 'TAUX_INTERET_MICRO_CREDIT', 'TAUX_COMMISSION_PADME'],
    type: 'percent',
  },
  {
    label: 'Scores crédit',
    icon: Shield,
    couleur: '#3B82F6',
    cles: ['SEUIL_SCORE_MICRO_CREDIT', 'SEUIL_SCORE_PADME'],
    type: 'number',
  },
  {
    label: 'Plafonds micro-crédit (FCFA)',
    icon: CreditCard,
    couleur: '#8B5CF6',
    cles: ['PLAFOND_MICRO_CREDIT_60', 'PLAFOND_MICRO_CREDIT_70', 'PLAFOND_MICRO_CREDIT_80', 'PLAFOND_MICRO_CREDIT_90'],
    type: 'fcfa',
  },
  {
    label: 'Seuils opérationnels',
    icon: AlertTriangle,
    couleur: '#F59E0B',
    cles: ['SEUIL_RETRAIT_ADMIN', 'SEUIL_ALERTE_SOLDE_FAIBLE'],
    type: 'fcfa',
  },
  {
    label: 'Sécurité',
    icon: Clock,
    couleur: '#EF4444',
    cles: ['DUREE_OTP_MINUTES'],
    type: 'number',
  },
  {
    label: 'Maintenance',
    icon: Settings,
    couleur: '#64748B',
    cles: ['MODE_MAINTENANCE', 'MESSAGE_MAINTENANCE'],
    type: 'special',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ParametresPage() {
  const { data: params, mutate, isLoading } = useSWR<Parametre[]>('/parametres', fetcher)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const parametres = params ?? []

  function getVal(cle: string) {
    return edits[cle] ?? parametres.find(p => p.cle === cle)?.valeur ?? ''
  }

  function setVal(cle: string, val: string) {
    setEdits(prev => ({ ...prev, [cle]: val }))
  }

  async function sauvegarder(cle: string) {
    const valeur = getVal(cle)
    if (!valeur) return
    setSaving(cle)
    try {
      await api.put(`/parametres/${cle}`, { valeur })
      await mutate()
      setEdits(prev => { const n = { ...prev }; delete n[cle]; return n })
      showToast('ok', `"${cle}" mis à jour avec succès`)
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setSaving(null)
    }
  }

  async function toggleMaintenance() {
    const current = getVal('MODE_MAINTENANCE')
    const newVal = current === 'true' ? 'false' : 'true'
    setSaving('MODE_MAINTENANCE')
    try {
      await api.put('/parametres/MODE_MAINTENANCE', { valeur: newVal })
      await mutate()
      showToast('ok', `Mode maintenance ${newVal === 'true' ? 'activé' : 'désactivé'}`)
    } catch (err) {
      showToast('err', extraireErreur(err))
    } finally {
      setSaving(null)
    }
  }

  function showToast(type: 'ok' | 'err', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  function fmtDate(d: string | null) {
    if (!d) return null
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const maintenanceActive = getVal('MODE_MAINTENANCE') === 'true'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2"
          style={{ background: toast.type === 'ok' ? '#2563EB' : '#EF4444', color: '#fff' }}>
          <CheckCircle2 size={16} />
          {toast.text}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0F172A' }}>Paramètres</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Configuration globale de la plateforme TontineBénin
          </p>
        </div>
        <button onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#EFF4FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
          <RefreshCw size={14} />
          Recharger
        </button>
      </div>

      {/* Alerte maintenance */}
      {maintenanceActive && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle size={18} style={{ color: '#EF4444' }} />
          <p className="text-sm font-bold" style={{ color: '#EF4444' }}>
            ⚠️ Mode maintenance actif — l&apos;application est inaccessible aux utilisateurs
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#F1F5F9' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {GROUPES.map(groupe => {
            const GroupIcon = groupe.icon
            const items = groupe.cles
              .map(cle => parametres.find(p => p.cle === cle))
              .filter(Boolean) as Parametre[]
            if (items.length === 0) return null

            return (
              <div key={groupe.label} className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.07)' }}>

                {/* Header groupe */}
                <div className="flex items-center gap-3 px-6 py-4"
                  style={{ borderBottom: '1px solid #E2E8F0', background: `${groupe.couleur}08` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${groupe.couleur}18` }}>
                    <GroupIcon size={16} style={{ color: groupe.couleur }} />
                  </div>
                  <h2 className="font-bold text-sm" style={{ color: '#0F172A' }}>{groupe.label}</h2>
                </div>

                {/* Items */}
                <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
                  {items.map(param => {
                    const val = getVal(param.cle)
                    const modifie = edits[param.cle] !== undefined
                    const isSaving = saving === param.cle

                    // Toggle maintenance
                    if (param.cle === 'MODE_MAINTENANCE') {
                      return (
                        <div key={param.cle} className="px-6 py-5 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Mode maintenance</p>
                            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{param.description}</p>
                            {param.misAJourLe && (
                              <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                                Modifié le {fmtDate(param.misAJourLe)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={toggleMaintenance}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: maintenanceActive ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)',
                              color: maintenanceActive ? '#EF4444' : '#2563EB',
                              border: `1.5px solid ${maintenanceActive ? 'rgba(239,68,68,0.3)' : 'rgba(22,163,74,0.3)'}`,
                            }}
                          >
                            {maintenanceActive
                              ? <><ToggleRight size={18} /> Actif — Désactiver</>
                              : <><ToggleLeft size={18} /> Inactif — Activer</>
                            }
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div key={param.cle} className="px-6 py-5 flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-48">
                          <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{param.cle.replace(/_/g, ' ')}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{param.description}</p>
                          {param.misAJourLe && (
                            <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                              Modifié le {fmtDate(param.misAJourLe)}
                            </p>
                          )}
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type={param.cle.includes('MESSAGE') ? 'text' : 'number'}
                              value={val}
                              onChange={e => setVal(param.cle, e.target.value)}
                              step={groupe.type === 'percent' ? '0.01' : '1'}
                              className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none transition-all"
                              style={{
                                width: param.cle.includes('MESSAGE') ? 320 : 120,
                                background: modifie ? `${groupe.couleur}08` : '#F8FAFC',
                                border: `1.5px solid ${modifie ? groupe.couleur : '#E2E8F0'}`,
                                color: '#0F172A',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            />
                            {groupe.type === 'percent' && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                                style={{ color: '#94A3B8' }}>
                                = {(parseFloat(val) * 100).toFixed(0)}%
                              </span>
                            )}
                            {groupe.type === 'fcfa' && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                                style={{ color: '#94A3B8' }}>F</span>
                            )}
                          </div>

                          {modifie && (
                            <button
                              onClick={() => sauvegarder(param.cle)}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                              style={{ background: groupe.couleur, color: '#fff' }}
                            >
                              <Save size={14} />
                              {isSaving ? 'Enreg...' : 'Enregistrer'}
                            </button>
                          )}

                          {param.estValeurParDefaut && !modifie && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                              style={{ background: '#F1F5F9', color: '#94A3B8' }}>
                              Défaut
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
