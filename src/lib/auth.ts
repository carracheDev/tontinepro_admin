import { api } from './api'

export interface AdminUser {
  id: string
  nom: string
  telephone: string
  role: string
}

export async function login(telephone: string, pin: string): Promise<string> {
  const res = await api.post('/auth/connexion', { telephone, pin })
  const token = res.data?.donnees?.accessToken
  if (!token) throw new Error('Token manquant dans la réponse')
  localStorage.setItem('admin_token', token)
  // Cookie lu par le middleware Next.js (pas httpOnly pour rester côté client)
  document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`
  return token
}

export function logout() {
  localStorage.removeItem('admin_token')
  document.cookie = 'admin_token=; path=/; max-age=0'
  window.location.href = '/login'
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
