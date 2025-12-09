import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  className,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-primary)] disabled:opacity-50',
    secondary:
      'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-accent)] focus-visible:ring-[var(--color-border)] disabled:opacity-50',
    ghost:
      'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-accent)] focus-visible:ring-[var(--color-border)] disabled:text-[var(--color-muted)]',
  }

  return (
    <button
      className={cn(baseClasses, variants[variant], className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-foreground)] border-t-transparent" />
          Processing…
        </span>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  )
}

