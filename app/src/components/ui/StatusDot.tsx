import { cn } from '@/lib/utils'

type Status = 'pass' | 'fail' | 'pending' | 'overdue' | 'na' | 'live'

interface StatusDotProps {
  status: Status
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusColors: Record<Status, string> = {
  pass: 'bg-chex-green',
  fail: 'bg-chex-red',
  pending: 'bg-chex-amber',
  overdue: 'bg-chex-red',
  na: 'bg-chex-faint',
  live: 'bg-chex-yellow',
}

const statusLabels: Record<Status, string> = {
  pass: 'Pass',
  fail: 'Fail',
  pending: 'Pending',
  overdue: 'Overdue',
  na: 'N/A',
  live: 'Live',
}

const sizeMap: Record<string, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}

export function StatusDot({ status, label, size = 'md', className }: StatusDotProps) {
  const isAnimated = status === 'live' || status === 'overdue'

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex">
        {isAnimated && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping',
              statusColors[status]
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', statusColors[status], sizeMap[size])} />
      </span>
      {(label ?? statusLabels[status]) && (
        <span className="text-xs text-chex-muted">{label ?? statusLabels[status]}</span>
      )}
    </span>
  )
}
