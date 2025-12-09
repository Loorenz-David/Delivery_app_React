import type { ReactNode } from 'react'

import { cn } from '../../lib/utils/cn'

export interface BasicButtonParams {
  variant?: 'primary' | 'secondary' | 'ghost' | 'darkBlue'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

interface BasicButtonProps{
  children: ReactNode
  params: BasicButtonParams
}

export function BasicButton({ children, params }: BasicButtonProps) {

  const {variant = "secondary", onClick, type = 'button', disabled = false, className} = params

  const styles = {
    
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border border-[var(--color-primary)] hover:bg-[#4a4a4a]',
    darkBlue:
      'bg-[var(--color-dark-blue)] text-[var(--color-primary-foreground)]  hover:bg-[var(--color-dark-blue)]/70',
    secondary: 'bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-accent)]',
    ghost: 'bg-transparent text-[var(--color-text)] border border-transparent',
  }

  return (
    <button
      type={type}
      onClick={(e)=> {
        e.currentTarget.blur()
        if (disabled) {
          e.preventDefault()
          return
        }
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        'cursor-pointer inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] duration-150 ease-out  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit',
        styles[variant],
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
