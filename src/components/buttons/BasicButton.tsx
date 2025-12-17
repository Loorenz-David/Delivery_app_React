import { forwardRef, type ReactNode } from 'react'

import { cn } from '../../lib/utils/cn'

export interface BasicButtonParams {
  variant?: 'primary' | 'secondary' | 'ghost' | 'darkBlue' | 'rounded'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

interface BasicButtonProps {
  children: ReactNode
  params: BasicButtonParams
}

export const BasicButton = forwardRef<HTMLButtonElement, BasicButtonProps>(function BasicButton(
  { children, params },
  ref,
) {
  const { variant = 'secondary', onClick, type = 'button', disabled = false, className, ariaLabel } = params

  const styles = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border border-[var(--color-primary)] hover:bg-[#4a4a4a] inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium',
    darkBlue:
      'bg-[var(--color-dark-blue)] text-[var(--color-primary-foreground)]  hover:bg-[var(--color-dark-blue)]/70 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium',
    secondary: 'bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-accent)] inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium',
    rounded:
      'inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white shadow-sm transition hover:bg-[var(--color-accent)] active:scale-95',
    ghost: 'bg-transparent text-[var(--color-text)] border border-transparent',
  }

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      ref={ref}
      onClick={(e) => {
        e.currentTarget.blur()
        if (disabled) {
          e.preventDefault()
          return
        }
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        'cursor-pointer  transition active:scale-[0.98] duration-150 ease-out  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit',
        styles[variant],
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  )
})
