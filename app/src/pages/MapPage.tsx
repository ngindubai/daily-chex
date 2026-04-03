import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui'

export function MapPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold tracking-tight mb-4">Live Map</h1>
      <Card className="min-h-[calc(100vh-12rem)] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-chex-yellow-bg border border-chex-yellow/20 flex items-center justify-center mx-auto">
              <MapPin className="h-8 w-8 text-chex-yellow" />
            </div>
            <div>
              <p className="text-lg font-semibold text-chex-text">Leaflet Map</p>
              <p className="text-sm text-chex-muted max-w-xs mx-auto">
                Interactive GPS map with dark tiles, check markers, site boundaries, and real-time operator positions. Built in Step 8.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
