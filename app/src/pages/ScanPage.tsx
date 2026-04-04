import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Camera, Keyboard, Loader2, AlertCircle } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { QrScanner } from '@/components/QrScanner'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Asset {
  id: string
}

export function ScanPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [mode, setMode] = useState<'idle' | 'camera' | 'manual'>('idle')
  const [manualCode, setManualCode] = useState('')
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')

  const resolveQr = async (code: string) => {
    if (resolving || !token) return
    setResolving(true)
    setError('')
    try {
      const asset = await api<Asset>(`/assets/qr/${encodeURIComponent(code)}`, { token })
      navigate(`/assets/${asset.id}`)
    } catch {
      setError(`No asset found for code "${code}"`)
      setResolving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Camera scanning mode */}
        {mode === 'camera' && (
          <>
            <QrScanner
              onResult={(code) => resolveQr(code)}
              onError={(err) => { setError(err); setMode('idle') }}
            />
            <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>
              Stop Camera
            </Button>
          </>
        )}

        {/* Idle — show the scan art */}
        {mode === 'idle' && (
          <Card className="aspect-square relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative h-48 w-48">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-chex-yellow rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-chex-yellow rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-chex-yellow rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-chex-yellow rounded-br-sm" />
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-chex-yellow to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine className="h-12 w-12 text-chex-faint" />
                </div>
              </div>
              <p className="text-sm font-medium text-chex-muted">Scan a QR sticker or enter the code</p>
            </div>
          </Card>
        )}

        {/* Manual entry mode */}
        {mode === 'manual' && (
          <Card className="text-left space-y-3">
            <h3 className="text-sm font-semibold">Enter QR code</h3>
            <Input
              placeholder="CHX-XXXXXXXX"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setMode('idle'); setManualCode('') }}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={!manualCode || resolving} onClick={() => resolveQr(manualCode)}>
                {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Look Up'}
              </Button>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resolving spinner */}
        {resolving && (
          <div className="flex items-center justify-center gap-2 text-sm text-chex-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Looking up asset...
          </div>
        )}

        {/* Mode buttons (idle only) */}
        {mode === 'idle' && (
          <div className="space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={() => { setError(''); setMode('camera') }}>
              <Camera className="h-5 w-5" />
              Open Camera
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => { setError(''); setMode('manual') }}>
              <Keyboard className="h-5 w-5" />
              Enter Code Manually
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 8px; opacity: 0; }
          10% { opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 1; }
          60% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
