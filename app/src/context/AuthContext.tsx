import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, ApiError } from '@/lib/api'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  role: 'operator' | 'supervisor' | 'manager' | 'admin'
  companyId: string
  teamId?: string
  siteId?: string
  email?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  loginWithPin: (companyId: string, pin: string) => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = 'chex_token'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  const saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Restore session from stored token
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api<AuthUser>('/auth/me', { token })
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token, logout])

  const loginWithPin = useCallback(
    async (companyId: string, pin: string) => {
      const res = await api<{ token: string; user: AuthUser }>('/auth/pin', {
        method: 'POST',
        body: JSON.stringify({ companyId, pin }),
      })
      saveToken(res.token)
      setUser(res.user)
    },
    [saveToken],
  )

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      saveToken(res.token)
      setUser(res.user)
    },
    [saveToken],
  )

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithPin, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
