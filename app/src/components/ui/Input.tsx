import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-chex-muted uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-chex-faint">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)]',
              'text-sm text-chex-text placeholder:text-chex-faint',
              'transition-colors duration-150',
              'hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30',
              icon ? 'pl-10 pr-3' : 'px-3',
              error && 'border-chex-red focus:border-chex-red focus:ring-chex-red/30',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-chex-red">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
