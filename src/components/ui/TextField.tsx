import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, helperText, className, id, ...rest },
  ref,
) {
  const generatedId = useId()
  const fieldId = id ?? `${rest.name || 'field'}-${generatedId}`

  return (
    <label className="flex w-full flex-col gap-1 text-sm text-[var(--color-text)]" htmlFor={fieldId}>
      <span className="font-medium">{label}</span>
      <input
        id={fieldId}
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-base text-[var(--color-text)] shadow-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
          className,
        )}
        {...rest}
      />
      <span className={cn('text-xs text-[var(--color-muted)]', error && 'text-red-500')}>
        {error ? error : helperText}
      </span>
    </label>
  )
})

