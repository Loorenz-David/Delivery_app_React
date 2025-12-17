import type { ReactNode } from 'react'

import { BasicButton } from '../buttons/BasicButton'

type ConfirmParams = {
  header?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

type PopupConfirmProps = {
  id?: string
  position?: number
  params?: ConfirmParams
  children?: ReactNode
  onRequestClose?: () => void
}

export function PopupConfirm({ params, onRequestClose, children }: PopupConfirmProps) {
  const {
    header = 'Confirm action',
    description = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  } = params ?? {}
  console.log('Rendering PopupConfirm')
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    onRequestClose?.()
  }

  const handleCancel = () => {
    onCancel?.()
    onRequestClose?.()
  }

  return (
    <div className="fixed inset-0 z-[12] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[var(--color-text)]">{header}</p>
          <p className="text-sm text-[var(--color-muted)]">{description}</p>
        </div>

        {children ? <div className="mt-4 text-sm text-[var(--color-text)]">{children}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          <BasicButton
            params={{
              variant: 'secondary',
              onClick: handleCancel,
            }}
          >
            {cancelLabel}
          </BasicButton>
          <BasicButton
            params={{
              variant: 'primary',
              onClick: () => void handleConfirm(),
            }}
          >
            {confirmLabel}
          </BasicButton>
        </div>
      </div>
    </div>
  )
}

// Simple content placeholder; blueprint handles layout and actions.
export function PopupConfirmContent() {
  return null
}
