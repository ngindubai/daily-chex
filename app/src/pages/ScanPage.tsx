import { ScanLine, Camera } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export function ScanPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Scanner viewport */}
        <Card className="aspect-square relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Scan frame */}
            <div className="relative h-48 w-48">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-chex-yellow rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-chex-yellow rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-chex-yellow rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-chex-yellow rounded-br-sm" />

              {/* Scanning line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-chex-yellow to-transparent animate-[scan_2s_ease-in-out_infinite]" />

              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="h-12 w-12 text-chex-faint" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-chex-muted">Point camera at QR code</p>
              <p className="text-xs text-chex-faint mt-1">QR scanning built in Step 5</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full">
            <Camera className="h-5 w-5" />
            Open Camera
          </Button>
          <Button variant="secondary" size="lg" className="w-full">
            Enter Code Manually
          </Button>
        </div>
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
