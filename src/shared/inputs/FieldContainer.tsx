import { InputWarning, type InputWarningState } from './InputWarning'
import type { InputWarningController } from './useInputWarning.hook'
import type { ReactNode } from 'react'

export function Field({
  label,
  children,
  required = false,
  warning,
  warningController,
  gap = 2
}: {
  label: string
  children: ReactNode
  required?: boolean
  warning?: InputWarningState
  warningController?: InputWarningController
  gap?: number
}) {
  const resolvedWarning = warningController?.warning ?? warning
  return (
    <label className={`flex w-full flex-col  ${'gap-' + gap}`}>
      <span className="text-xs font-semibold text-[var(--color-muted)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {resolvedWarning && <InputWarning {...resolvedWarning} />}
    </label>
  )
}
