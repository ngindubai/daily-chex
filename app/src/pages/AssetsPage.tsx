import { Package, Search, Plus } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'

const mockAssets = [
  { id: 1, name: 'Ford Transit LJ72 XKR', type: 'Vehicle', site: 'M62 Junction 8', status: 'active', lastCheck: 'Today' },
  { id: 2, name: 'CAT 320 Excavator', type: 'Plant', site: 'Manchester Water Main', status: 'defective', lastCheck: 'Today' },
  { id: 3, name: 'Hilti TE 60-ATC', type: 'Plant', site: 'M62 Junction 8', status: 'active', lastCheck: 'Today' },
  { id: 4, name: 'Ifor Williams HB510', type: 'Trailer', site: 'Leeds A64 Widening', status: 'active', lastCheck: 'Yesterday' },
  { id: 5, name: 'Wacker Neuson DPU 6555', type: 'Plant', site: 'Manchester Water Main', status: 'defective', lastCheck: 'Yesterday' },
  { id: 6, name: 'Mercedes Sprinter YH71 BKL', type: 'Vehicle', site: 'M62 Junction 8', status: 'active', lastCheck: '2 days ago' },
]

const statusBadge: Record<string, React.ReactNode> = {
  active: <Badge variant="green">Active</Badge>,
  defective: <Badge variant="red">Defective</Badge>,
  inactive: <Badge variant="default">Inactive</Badge>,
}

const typeBadge: Record<string, React.ReactNode> = {
  Vehicle: <Badge variant="blue">Vehicle</Badge>,
  Plant: <Badge variant="yellow">Plant</Badge>,
  Trailer: <Badge variant="amber">Trailer</Badge>,
}

export function AssetsPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Assets</h1>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Asset
        </Button>
      </div>

      <Input
        placeholder="Search assets..."
        icon={<Search className="h-4 w-4" />}
      />

      <div className="space-y-2">
        {mockAssets.map((asset) => (
          <Card key={asset.id} className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors">
            <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-raised flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-chex-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-chex-text truncate">{asset.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {typeBadge[asset.type]}
                <span className="text-xs text-chex-muted">{asset.site}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {statusBadge[asset.status]}
              <p className="text-xs text-chex-faint mt-1">Checked {asset.lastCheck}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
