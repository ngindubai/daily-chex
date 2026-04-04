import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { HardHat, Keyboard, ArrowLeft, Delete, LogIn, Mail, Lock, Building2, Loader2 } from 'lucide-react'

interface Company {
  id: string
  name: string
}

type Screen = 'choose' | 'pin' | 'email'

export function LoginPage() {
  const { loginWithPin, loginWithEmail } = useAuth()
  const [screen, setScreen] = useState<Screen>('choose')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api<Company[]>('/companies').then(setCompanies).catch(() => {})
  }, [])

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return
      const next = pin + digit
      setPin(next)
      setError('')

      // Auto-submit on 4 digits
      if (next.length === 4 && selectedCompany) {
        setLoading(true)
        loginWithPin(selectedCompany.id, next).catch((err) => {
          setError(err.message || 'Invalid PIN')
          setPin('')
          setLoading(false)
        })
      }
    },
    [pin, selectedCompany, loginWithPin],
  )

  const handlePinBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      await loginWithEmail(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  // Handle physical keyboard for PIN entry
  useEffect(() => {
    if (screen !== 'pin') return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handlePinDigit(e.key)
      else if (e.key === 'Backspace') handlePinBackspace()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, handlePinDigit, handlePinBackspace])

  return (
    <div className="min-h-screen bg-chex-bg flex flex-col items-center justify-center p-4">
      {/* Logo / title */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <HardHat className="w-10 h-10 text-chex-yellow" />
          <h1 className="text-3xl font-bold tracking-tight font-[var(--font-display)] text-chex-text">
            daily<span className="text-chex-yellow">-chex</span>
          </h1>
        </div>
        <p className="text-sm text-chex-muted">Plant & vehicle compliance tracking</p>
      </div>

      {/* Screen: Choose login method */}
      {screen === 'choose' && (
        <div className="w-full max-w-sm space-y-4">
          {/* Company selector */}
          {companies.length > 0 && !selectedCompany && (
            <div className="bg-chex-surface border border-chex-border rounded-[var(--radius-lg)] p-5 space-y-3">
              <p className="text-xs font-medium text-chex-muted uppercase tracking-wider">Select company</p>
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-chex-raised border border-chex-border hover:border-chex-yellow/40 hover:bg-chex-hover transition-colors text-left cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-chex-yellow shrink-0" />
                  <span className="text-sm font-medium text-chex-text">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedCompany && (
            <>
              <div className="bg-chex-surface border border-chex-border rounded-[var(--radius-lg)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-chex-yellow" />
                  <span className="text-sm font-medium text-chex-text">{selectedCompany.name}</span>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-xs text-chex-muted hover:text-chex-text transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full text-base"
                onClick={() => setScreen('pin')}
              >
                <Keyboard className="w-5 h-5" />
                Enter PIN
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full text-base"
                onClick={() => setScreen('email')}
              >
                <Mail className="w-5 h-5" />
                Manager Login
              </Button>
            </>
          )}
        </div>
      )}

      {/* Screen: PIN entry */}
      {screen === 'pin' && selectedCompany && (
        <div className="w-full max-w-xs space-y-6">
          <button
            onClick={() => {
              setScreen('choose')
              setPin('')
              setError('')
            }}
            className="flex items-center gap-1 text-sm text-chex-muted hover:text-chex-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center space-y-2">
            <p className="text-xs text-chex-muted uppercase tracking-wider">Enter your 4-digit PIN</p>
            {/* PIN dots */}
            <div className="flex justify-center gap-4 py-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-chex-yellow border-chex-yellow scale-110'
                      : 'border-chex-border bg-chex-surface'
                  }`}
                />
              ))}
            </div>
            {error && <p className="text-sm text-chex-red">{error}</p>}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-chex-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verifying...</span>
              </div>
            )}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
              if (key === '')
                return <div key="empty" />
              if (key === 'del')
                return (
                  <button
                    key="del"
                    onClick={handlePinBackspace}
                    disabled={loading}
                    className="h-16 rounded-[var(--radius-md)] bg-chex-raised border border-chex-border text-chex-muted hover:bg-chex-hover active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                )
              return (
                <button
                  key={key}
                  onClick={() => handlePinDigit(key)}
                  disabled={loading}
                  className="h-16 rounded-[var(--radius-md)] bg-chex-raised border border-chex-border text-xl font-semibold text-chex-text hover:bg-chex-hover hover:border-chex-yellow/30 active:scale-95 active:bg-chex-yellow/10 transition-all cursor-pointer disabled:opacity-40"
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Screen: Email login */}
      {screen === 'email' && (
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => {
              setScreen('choose')
              setEmail('')
              setPassword('')
              setError('')
            }}
            className="flex items-center gap-1 text-sm text-chex-muted hover:text-chex-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chex-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="name@company.co.uk"
                  autoComplete="email"
                  className="w-full h-12 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text placeholder:text-chex-faint pl-10 pr-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chex-faint" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text placeholder:text-chex-faint pl-10 pr-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-sm text-chex-red">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      <p className="mt-8 text-xs text-chex-faint">
        Test PINs: 1234 (manager) · 5678 (supervisor) · 1111 (operator)
      </p>
    </div>
  )
}
