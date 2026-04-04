import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'

interface QrScannerProps {
  onResult: (code: string) => void
  onError?: (error: string) => void
}

export function QrScanner({ onResult, onError }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [started, setStarted] = useState(false)

  const stop = useCallback(async () => {
    const s = scannerRef.current
    if (s) {
      try {
        const state = s.getState()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await s.stop()
        }
      } catch { /* already stopped */ }
      try { s.clear() } catch { /* ignore */ }
      scannerRef.current = null
    }
    setStarted(false)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const id = 'qr-reader-' + Math.random().toString(36).slice(2, 8)
    el.id = id

    const scanner = new Html5Qrcode(id)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          onResult(decodedText)
        },
        () => { /* ignore scan failures */ },
      )
      .then(() => setStarted(true))
      .catch((err: Error) => {
        onError?.(err.message || 'Camera access denied')
      })

    return () => {
      stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full overflow-hidden rounded-[var(--radius-lg)]" />
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-chex-surface rounded-[var(--radius-lg)]">
          <p className="text-sm text-chex-muted animate-pulse">Starting camera...</p>
        </div>
      )}
    </div>
  )
}
