'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import {
  ArrowDownToLine, ShieldCheck, Scale, AlertTriangle, ArrowRight, Inbox, Clock,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then((r) => r.data?.donnees ?? r.data)
const depuis = (d: string) => {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 60) return `il y a ${min} min`
  if (min < 1440) return `il y a ${Math.floor(min / 60)} h`
  return `il y a ${Math.floor(min / 1440)} j`
}

type Item = { id: string; type: string; categorie: string; titre: string; sousTitre: string; montant: number | null; urgence: number; date: string; lien: string }
type Data = { items: Item[]; compteurs: { total: number; retraits: number; kyc: number; litiges: number; alertes: number } }

const TYPE: Record<string, { icon: any; color: string }> = {
  RETRAIT: { icon: ArrowDownToLine, color: COLORS.danger },
  KYC: { icon: ShieldCheck, color: COLORS.warning },
  LITIGE: { icon: Scale, color: COLORS.info },
  ALERTE: { icon: AlertTriangle, color: COLORS.danger },
}
const niveau = (u: number) =>
  u >= 90 ? { l: 'CRITIQUE', c: COLORS.danger } : u >= 70 ? { l: 'HAUTE', c: COLORS.warning }
    : u >= 50 ? { l: 'MOYENNE', c: COLORS.info } : { l: 'BASSE', c: COLORS.text.muted }

function Chip({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2" style={{ borderColor: COLORS.border }}>
      <span className="text-lg font-black tabular-nums" style={{ color }}>{n}</span>
      <span className="text-xs font-semibold text-gray-500">{label}</span>
    </div>
  )
}

export default function ActionCenter() {
  const { data, isLoading } = useSWR<Data>('/analytics/action-center', fetcher, { refreshInterval: 30000 })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: COLORS.text.primary }}>
          <Inbox size={24} style={{ color: COLORS.primary }} /> Centre d'action
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Tout ce qui requiert une décision, trié par urgence — le système pousse ce qui compte.</p>
      </div>

      {data && (
        <div className="flex flex-wrap gap-2.5">
          <Chip label="À traiter" n={data.compteurs.total} color={COLORS.primary} />
          <Chip label="Retraits" n={data.compteurs.retraits} color={COLORS.danger} />
          <Chip label="KYC" n={data.compteurs.kyc} color={COLORS.warning} />
          <Chip label="Litiges" n={data.compteurs.litiges} color={COLORS.info} />
          <Chip label="Alertes" n={data.compteurs.alertes} color={COLORS.danger} />
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-400">Chargement de la file…</div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-20" style={{ borderColor: COLORS.border, background: '#fff' }}>
          <ShieldCheck size={44} className="mb-3" style={{ color: COLORS.success }} />
          <p className="font-semibold" style={{ color: COLORS.text.primary }}>Rien à traiter — tout est à jour ✅</p>
          <p className="text-sm text-gray-400">Aucun retrait, KYC, litige ou alerte en attente.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.items.map((it) => {
            const t = TYPE[it.type] ?? { icon: Inbox, color: COLORS.text.muted }
            const n = niveau(it.urgence)
            const Ic = t.icon
            return (
              <Link key={it.type + it.id} href={it.lien}
                className="flex items-center gap-3 rounded-xl border bg-white p-3.5 transition-shadow hover:shadow-md"
                style={{ borderColor: COLORS.border, borderLeft: `4px solid ${n.c}` }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.opacity(t.color, 0.12) }}>
                  <Ic size={18} style={{ color: t.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: COLORS.opacity(n.c, 0.12), color: n.c }}>{n.l}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{it.categorie}</span>
                  </div>
                  <div className="mt-0.5 truncate font-bold" style={{ color: COLORS.text.primary }}>{it.titre}</div>
                  {it.sousTitre && <div className="truncate text-sm text-gray-500">{it.sousTitre}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1 text-xs text-gray-400"><Clock size={12} /> {depuis(it.date)}</div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: COLORS.primary }}>Traiter <ArrowRight size={14} /></div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
