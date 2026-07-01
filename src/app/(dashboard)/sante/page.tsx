'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import { StatCard } from '@/components/ui/data-table'
import { Activity, Database, Server, CreditCard, AlertTriangle, Cpu } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then((r) => r.data?.donnees ?? r.data)
const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

type Sante = {
  api: { statut: string; uptimeSec: number }
  db: { statut: string; latenceMs: number }
  memoire: { rssMo: number; heapMo: number }
  paiements: { tauxReussite: number; transactions24h: number; succes24h: number; echecs24h: number }
  alertesOuvertes: number
  horodatage: string
}

function HealthCard({ icon: Icon, titre, ok, valeur, sous }: { icon: any; titre: string; ok: boolean; valeur: string; sous: string }) {
  const c = ok ? COLORS.success : COLORS.danger
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.border }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: COLORS.opacity(c, 0.12) }}>
          <Icon size={20} style={{ color: c }} />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: c }}>
          <span className="h-2 w-2 rounded-full" style={{ background: c }} /> {ok ? 'OK' : 'KO'}
        </span>
      </div>
      <div className="text-2xl font-black" style={{ color: COLORS.text.primary }}>{valeur}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-500">{titre}</div>
      <div className="text-xs text-gray-400">{sous}</div>
    </div>
  )
}

export default function SantePage() {
  const { data } = useSWR<Sante>('/analytics/sante-systeme', fetcher, { refreshInterval: 15_000 })

  if (!data) return <div className="py-16 text-center text-gray-400">Vérification de la santé système…</div>
  const { api: a, db, memoire, paiements, alertesOuvertes } = data
  const toutOk = a.statut === 'en ligne' && db.statut === 'en ligne' && paiements.tauxReussite >= 80 && alertesOuvertes === 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: COLORS.text.primary }}>
          <Activity size={24} style={{ color: COLORS.primary }} /> Santé système
        </h1>
        <p className="text-sm text-gray-500">État de la plateforme en temps réel · mise à jour auto (15 s)</p>
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl border p-4" style={{ borderColor: COLORS.opacity(toutOk ? COLORS.success : COLORS.danger, 0.3), background: COLORS.opacity(toutOk ? COLORS.success : COLORS.danger, 0.05) }}>
        <span className="h-3 w-3 rounded-full animate-pulse" style={{ background: toutOk ? COLORS.success : COLORS.danger }} />
        <span className="font-bold" style={{ color: toutOk ? COLORS.success : COLORS.danger }}>
          {toutOk ? 'Plateforme opérationnelle — tout va bien ✅' : 'Attention — un ou plusieurs indicateurs à surveiller'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HealthCard icon={Server} titre="API Backend" ok={a.statut === 'en ligne'} valeur={a.statut} sous={`Uptime : ${fmtUptime(a.uptimeSec)}`} />
        <HealthCard icon={Database} titre="Base de données" ok={db.statut === 'en ligne'} valeur={db.statut} sous={`Latence : ${db.latenceMs} ms`} />
        <HealthCard icon={CreditCard} titre="Taux KKiaPay (24 h)" ok={paiements.tauxReussite >= 80} valeur={`${paiements.tauxReussite}%`} sous={`${paiements.succes24h} succès · ${paiements.echecs24h} échecs`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Cpu} label="Mémoire (RSS)" value={`${memoire.rssMo} Mo`} color={COLORS.info} />
        <StatCard icon={CreditCard} label="Transactions 24 h" value={paiements.transactions24h} color={COLORS.primary} />
        <StatCard icon={AlertTriangle} label="Alertes ouvertes" value={alertesOuvertes} color={alertesOuvertes > 0 ? COLORS.danger : COLORS.success} />
      </div>
    </div>
  )
}
