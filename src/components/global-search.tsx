'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/colors'
import { Search, User, Scale, Receipt, CornerDownLeft } from 'lucide-react'

type Res = { type: string; id: string; titre: string; sousTitre: string; lien: string }
const ICON: Record<string, any> = { CLIENT: User, LITIGE: Scale, TRANSACTION: Receipt }
const LABEL: Record<string, string> = { CLIENT: 'Client', LITIGE: 'Litige', TRANSACTION: 'Transaction' }

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Res[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQ(''); setRes([]); setIdx(0) }
  }, [open])

  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/analytics/search?q=${encodeURIComponent(q)}`)
        setRes(r.data?.donnees?.resultats ?? []); setIdx(0)
      } catch { setRes([]) } finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const go = (r: Res) => { setOpen(false); router.push(r.lien) }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, res.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && res[idx]) { e.preventDefault(); go(res[idx]) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50"
        style={{ borderColor: COLORS.border }}>
        <Search size={15} /> <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="ml-1 rounded border px-1.5 text-[10px] font-semibold" style={{ borderColor: COLORS.border }}>Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: COLORS.border }}>
              <Search size={18} style={{ color: COLORS.text.muted }} />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Client, téléphone, litige, référence…" className="flex-1 text-sm outline-none" />
              {loading && <span className="text-xs text-gray-400">…</span>}
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {q.trim().length < 2 ? (
                <div className="py-8 text-center text-sm text-gray-400">Tape au moins 2 caractères.</div>
              ) : res.length === 0 && !loading ? (
                <div className="py-8 text-center text-sm text-gray-400">Aucun résultat pour « {q} ».</div>
              ) : (
                res.map((r, i) => {
                  const Ic = ICON[r.type] ?? Search
                  return (
                    <button key={r.type + r.id} onClick={() => go(r)} onMouseEnter={() => setIdx(i)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
                      style={{ background: i === idx ? COLORS.opacity(COLORS.primary, 0.08) : 'transparent' }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: COLORS.background.page }}>
                        <Ic size={15} style={{ color: COLORS.primary }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold" style={{ color: COLORS.text.primary }}>{r.titre}</div>
                        <div className="truncate text-xs text-gray-400">{LABEL[r.type] ?? r.type} · {r.sousTitre}</div>
                      </div>
                      {i === idx && <CornerDownLeft size={14} style={{ color: COLORS.text.muted }} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
