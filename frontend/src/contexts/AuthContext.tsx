import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, API_URL } from '@/lib/fetch'

export type User = {
  login: string
  name: string
  avatarUrl: string
}

type AuthState = {
  user: User | null
  loading: boolean
  /** Redirects to GitHub's consent screen (real OAuth). */
  login: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // The session lives in an HttpOnly cookie — just ask the API who we are.
  useEffect(() => {
    apiFetch<{ user: User }>('/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  function login() {
    window.location.href = `${API_URL}/auth/github`
  }

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
