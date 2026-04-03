import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-chex-yellow text-chex-black font-semibold hover:bg-chex-yellow-bright active:scale-[0.97] shadow-[0_0_20px_rgba(250,204,21,0.15)]',
  secondary:
    'bg-chex-raised text-chex-text border border-chex-border hover:bg-chex-hover hover:border-chex-muted active:scale-[0.97]',
  ghost:
    'text-chex-muted hover:text-chex-text hover:bg-chex-raised active:scale-[0.97]',
  danger:
    'bg-chex-red-bg text-chex-red border border-chex-red/20 hover:bg-chex-red/20 active:scale-[0.97]',
  outline:
    'border border-chex-yellow/30 text-chex-yellow hover:bg-chex-yellow-bg hover:border-chex-yellow/50 active:scale-[0.97]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-[var(--radius-md)]',
  icon: 'h-10 w-10 rounded-[var(--radius-md)] justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium transition-all duration-150 cursor-pointer select-none',
          'disabled:opacity-40 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
