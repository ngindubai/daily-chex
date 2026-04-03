import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'yellow' | 'green' | 'red' | 'amber'
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const colorMap = {
  yellow: 'bg-chex-yellow',
  green: 'bg-chex-green',
  red: 'bg-chex-red',
  amber: 'bg-chex-amber',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'yellow',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 bg-chex-raised rounded-full overflow-hidden',
          size === 'sm' ? 'h-1' : 'h-2'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorMap[color]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-chex-muted min-w-[3ch] text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
