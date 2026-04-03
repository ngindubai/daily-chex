import { ClipboardCheck } from 'lucide-react'
import { Card, Badge } from '@/components/ui'

const mockChecks = [
  { id: 1, asset: 'Ford Transit LJ72 XKR', type: 'Daily Vehicle', operator: 'Dave Mitchell', date: 'Today, 09:42', status: 'pass' },
  { id: 2, asset: 'CAT 320 Excavator', type: 'PUWER Weekly', operator: 'Mike Taylor', date: 'Today, 09:15', status: 'fail' },
  { id: 3, asset: 'Hilti TE 60-ATC', type: 'PUWER Weekly', operator: 'Chris Palmer', date: 'Today, 08:30', status: 'pass' },
  { id: 4, asset: 'Ifor Williams HB510', type: 'Trailer Weekly', operator: 'Steve Roberts', date: 'Yesterday, 16:20', status: 'pass' },
  { id: 5, asset: 'Wacker Neuson DPU', type: 'PUWER Weekly', operator: 'Dave Mitchell', date: 'Yesterday, 14:05', status: 'fail' },
]

const statusBadge = {
  pass: <Badge variant="green">Pass</Badge>,
  fail: <Badge variant="red">Fail</Badge>,
  pending: <Badge variant="amber">Pending</Badge>,
}

export function ChecksPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Checks</h1>
        <Badge variant="yellow">{mockChecks.length} total</Badge>
      </div>

      <div className="space-y-2">
        {mockChecks.map((check) => (
          <Card key={check.id} className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors">
            <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-raised flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5 text-chex-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-chex-text truncate">{check.asset}</p>
              <p className="text-xs text-chex-muted">{check.type} · {check.operator}</p>
            </div>
            <div className="text-right shrink-0">
              {statusBadge[check.status as keyof typeof statusBadge]}
              <p className="text-xs text-chex-faint mt-1">{check.date}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
