'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { extraireErreur } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [telephone, setTelephone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      await login(telephone, pin)
      router.push('/dashboard')
    } catch (err) {
      setErreur(extraireErreur(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-hero)' }}>
      <div className="w-full max-w-md px-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black"
            style={{ background: 'var(--primary)' }}
          >
            T
          </div>
          <h1 className="text-2xl font-bold text-white">TontineBénin</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Interface d&apos;administration
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-lg font-bold text-white mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Téléphone
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 0197000000"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-vif)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Code PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none tracking-widest transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-vif)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            {erreur && (
              <div className="px-4 py-3 rounded-xl text-sm text-white" style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)' }}>
                {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !telephone || !pin}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all mt-2"
              style={{
                background: loading || !telephone || !pin ? 'rgba(10,124,74,0.4)' : 'var(--primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Accès réservé aux administrateurs autorisés
        </p>
      </div>
    </div>
  )
}
