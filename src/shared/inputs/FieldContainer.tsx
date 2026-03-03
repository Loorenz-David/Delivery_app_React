import { InputWarning, type InputWarningState } from './InputWarning'
import type { InputWarningController } from './useInputWarning.hook'
import type { ReactNode } from 'react'

export function Field({
  label,
  children,
  required = false,
  warning,
  warningController,
  gap = 1,
  warningPlacement ='atBottom'
}: {
  label: string
  children: ReactNode
  required?: boolean
  warning?: InputWarningState
  warningController?: InputWarningController
  gap?: number
  warningPlacement?: 'atBottom' | 'besidesLabel'
}) {
  const resolvedWarning = warningController?.warning ?? warning
  return (
    <label className={`flex w-full flex-col  ${'gap-' + gap}`}>
      <div className="flex justify-between">
        <span className="text-[10px] font-semibold text-[var(--color-muted)]">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}

        </span>
        {warningPlacement == 'besidesLabel' && 
          <div>
              {resolvedWarning && <InputWarning {...resolvedWarning} />}
          </div>
        }
      </div>
      {children}
      {warningPlacement == 'atBottom' && 
        resolvedWarning && <InputWarning {...resolvedWarning} />
      }
    </label>
  )
}
