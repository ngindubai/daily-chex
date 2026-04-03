import { Building2, Plus, Users, Package } from 'lucide-react'
import { Card, Badge, Button, ProgressBar } from '@/components/ui'

const mockSites = [
  { id: 1, name: 'M62 Junction 8', location: 'Warrington, Cheshire', teams: 2, people: 12, assets: 34, checksToday: 14, checksTotal: 18, defects: 3, status: 'active' },
  { id: 2, name: 'Leeds A64 Widening', location: 'Cross Gates, Leeds', teams: 1, people: 6, assets: 18, checksToday: 8, checksTotal: 8, defects: 0, status: 'active' },
  { id: 3, name: 'Manchester Water Main', location: 'Salford, Manchester', teams: 3, people: 22, assets: 45, checksToday: 6, checksTotal: 14, defects: 5, status: 'active' },
]

export function SitesPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Sites</h1>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Site
        </Button>
      </div>

      <div className="grid gap-3">
        {mockSites.map((site) => (
          <Card key={site.id} className="cursor-pointer hover:border-chex-yellow/20 transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-chex-raised flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-chex-yellow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-chex-text">{site.name}</p>
                  {site.defects > 0 ? (
                    <Badge variant="red">{site.defects} defects</Badge>
                  ) : (
                    <Badge variant="green">All clear</Badge>
                  )}
                </div>
                <p className="text-xs text-chex-muted mb-3">{site.location}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-chex-muted mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {site.people} people · {site.teams} team{site.teams !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {site.assets} assets
                  </span>
                </div>

                {/* Check progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-chex-muted">
                    <span>Today's checks</span>
                    <span className="font-mono">{site.checksToday}/{site.checksTotal}</span>
                  </div>
                  <ProgressBar
                    value={site.checksToday}
                    max={site.checksTotal}
                    color={site.checksToday === site.checksTotal ? 'green' : 'yellow'}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
