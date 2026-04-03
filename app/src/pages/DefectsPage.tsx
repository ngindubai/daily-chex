import { AlertTriangle } from 'lucide-react'
import { Card, Badge, StatusDot } from '@/components/ui'

const mockDefects = [
  { id: 1, title: 'Hydraulic leak — boom cylinder', asset: 'CAT 320 Excavator', severity: 'critical', reported: '2h ago', status: 'open' },
  { id: 2, title: 'Near-side headlight cracked', asset: 'Ford Transit LJ72 XKR', severity: 'high', reported: '5h ago', status: 'open' },
  { id: 3, title: 'Vibration plate handle loose', asset: 'Wacker Neuson DPU', severity: 'medium', reported: '1d ago', status: 'in_progress' },
  { id: 4, title: 'Trailer light connector corroded', asset: 'Ifor Williams HB510', severity: 'low', reported: '2d ago', status: 'in_progress' },
]

const severityBadge: Record<string, React.ReactNode> = {
  critical: <Badge variant="red" pulse>Critical</Badge>,
  high: <Badge variant="red">High</Badge>,
  medium: <Badge variant="amber">Medium</Badge>,
  low: <Badge variant="default">Low</Badge>,
}

const statusLabel: Record<string, React.ReactNode> = {
  open: <StatusDot status="fail" label="Open" />,
  in_progress: <StatusDot status="pending" label="In Progress" />,
  resolved: <StatusDot status="pass" label="Resolved" />,
}

export function DefectsPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Defects</h1>
        <Badge variant="red" pulse>{mockDefects.filter(d => d.status === 'open').length} open</Badge>
      </div>

      <div className="space-y-2">
        {mockDefects.map((defect) => (
          <Card
            key={defect.id}
            variant={defect.severity === 'critical' ? 'red' : 'default'}
            glow={defect.severity === 'critical'}
            className="cursor-pointer hover:border-chex-yellow/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-red/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-chex-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium text-chex-text">{defect.title}</p>
                  {severityBadge[defect.severity]}
                </div>
                <p className="text-xs text-chex-muted">{defect.asset}</p>
                <div className="flex items-center gap-3 mt-2">
                  {statusLabel[defect.status]}
                  <span className="text-xs text-chex-faint">{defect.reported}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
