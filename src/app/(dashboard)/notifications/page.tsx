'use client'

import { useState } from 'react'
import { api, extraireErreur } from '@/lib/api'
import { Bell, Send } from 'lucide-react'

const TYPES = ['INFO', 'ALERTE', 'SUCCES', 'PROMOTION']
const CIBLES = [
  { value: 'TOUS',        label: 'Tous les utilisateurs' },
  { value: 'CLIENTS',     label: 'Clients uniquement' },
  { value: 'COLLECTEURS', label: 'Collecteurs uniquement' },
]

export default function NotificationsPage() {
  const [titre, setTitre] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('INFO')
  const [cible, setCible] = useState('TOUS')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function envoyer() {
    if (!titre.trim() || !message.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/notifications/diffuser', { titre, message, type, cible })
      setMsg({ type: 'ok', text: `Notification envoyée à ${cible === 'TOUS' ? 'tous les utilisateurs' : cible.toLowerCase()} ✓` })
      setTitre('')
      setMessage('')
    } catch (err) {
      setMsg({ type: 'err', text: extraireErreur(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Envoyer une notification push</h2>
        </div>

        {/* Cible */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Destinataires</label>
          <div className="flex gap-2 flex-wrap">
            {CIBLES.map(c => (
              <button
                key={c.value}
                onClick={() => setCible(c.value)}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: cible === c.value ? 'var(--primary)' : '#F9FAFB',
                  color: cible === c.value ? '#fff' : 'var(--muted)',
                  border: `1px solid ${cible === c.value ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Type</label>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: type === t ? 'var(--info)' : '#F9FAFB',
                  color: type === t ? '#fff' : 'var(--muted)',
                  border: `1px solid ${type === t ? 'var(--info)' : 'var(--border)'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Titre</label>
          <input
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Ex: Maintenance prévue ce soir"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: '#fff', border: '1px solid var(--border)' }}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Corps de la notification..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#fff', border: '1px solid var(--border)' }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted)' }}>{message.length}/500</p>
        </div>

        {/* Feedback */}
        {msg && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: msg.type === 'ok' ? 'rgba(37,99,235,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'ok' ? 'var(--primary)' : 'var(--danger)' }}>
            {msg.text}
          </div>
        )}

        {/* Bouton */}
        <button
          onClick={envoyer}
          disabled={loading || !titre.trim() || !message.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40"
          style={{ background: 'var(--primary)' }}
        >
          <Send size={16} />
          {loading ? 'Envoi...' : 'Envoyer la notification'}
        </button>
      </div>

      {/* Info */}
      <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.2)', color: 'var(--info)' }}>
        Les notifications push sont envoyées via Firebase Cloud Messaging (FCM) aux appareils connectés.
        Les utilisateurs sans token FCM enregistré recevront uniquement la notification en base.
      </div>
    </div>
  )
}
