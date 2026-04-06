import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'yellow' | 'green' | 'red' | 'amber' | 'blue'

interface CardProps {
  variant?: CardVariant
  glow?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-chex-surface border-chex-border',
  yellow: 'bg-chex-yellow-bg border-chex-yellow/20',
  green: 'bg-chex-green-bg border-chex-green/20',
  red: 'bg-chex-red-bg border-chex-red/20',
  amber: 'bg-chex-amber-bg border-chex-amber/20',
  blue: 'bg-chex-blue-bg border-chex-blue/20',
}

const glowMap: Record<CardVariant, string> = {
  default: '',
  yellow: 'glow-yellow',
  green: 'glow-green',
  red: 'glow-red',
  amber: 'glow-amber',
  blue: '',
}

export function Card({ variant = 'default', glow = false, className, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative border rounded-[var(--radius-lg)] p-5 transition-all duration-200',
        variantStyles[variant],
        glow && glowMap[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h3 className={cn('text-sm font-semibold text-chex-text tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardValue({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('text-3xl font-bold tracking-tight font-[var(--font-display)]', className)}>
      {children}
    </div>
  )
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn('text-xs text-chex-muted mt-1', className)}>
      {children}
    </p>
  )
}
