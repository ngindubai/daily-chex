import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'yellow' | 'green' | 'red' | 'amber' | 'blue' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  pulse?: boolean
  className?: string
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-chex-raised text-chex-muted border-chex-border',
  yellow: 'bg-chex-yellow-bg text-chex-yellow border-chex-yellow/20',
  green: 'bg-chex-green-bg text-chex-green border-chex-green/20',
  red: 'bg-chex-red-bg text-chex-red border-chex-red/20',
  amber: 'bg-chex-amber-bg text-chex-amber border-chex-amber/20',
  blue: 'bg-chex-blue-bg text-chex-blue border-chex-blue/20',
  outline: 'bg-transparent text-chex-muted border-chex-border',
}

export function Badge({ variant = 'default', pulse = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border leading-tight uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  )
}
