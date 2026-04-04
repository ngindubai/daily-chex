import { useRef, useEffect, useCallback } from 'react'
import SignaturePad from 'signature_pad'
import { Button } from '@/components/ui'
import { RotateCcw } from 'lucide-react'

interface SignatureCanvasProps {
  onEnd: (dataUrl: string) => void
}

export function SignatureCanvas({ onEnd }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Size canvas to container
    const rect = canvas.parentElement!.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = 160

    const pad = new SignaturePad(canvas, {
      penColor: '#facc15',
      backgroundColor: '#111113',
      minWidth: 1.5,
      maxWidth: 3,
    })

    pad.addEventListener('endStroke', () => {
      onEnd(pad.toDataURL('image/png'))
    })

    padRef.current = pad

    return () => {
      pad.off()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clear = useCallback(() => {
    padRef.current?.clear()
    onEnd('')
  }, [onEnd])

  return (
    <div className="space-y-2">
      <div className="relative border border-chex-border rounded-[var(--radius-md)] overflow-hidden bg-chex-surface">
        <canvas ref={canvasRef} className="w-full touch-none" />
        <div className="absolute bottom-2 left-3 right-3 border-t border-dashed border-chex-faint/40" />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-chex-faint">Sign above the line</span>
        <Button variant="ghost" size="sm" onClick={clear} type="button">
          <RotateCcw className="w-3 h-3" />
          Clear
        </Button>
      </div>
    </div>
  )
}
