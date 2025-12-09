import { useEffect, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { BasicButton } from '../../../../components/buttons/BasicButton'

const fieldContainer = 'custom-field-container'
const fieldInput = 'custom-input'

export interface AccountPasswordValues {
  newPassword: string
  confirmPassword: string
}

interface AccountPasswordCardProps {
  onSave?: (payload: AccountPasswordValues) => Promise<boolean | void> | boolean | void
  value?: AccountPasswordValues
  onChange?: (value: AccountPasswordValues) => void
  hideSubmitButton?: boolean
  submitLabel?: string
  onDirtyChange?: (dirty: boolean) => void
  baseline?: AccountPasswordValues
}

const DEFAULT_BASELINE: AccountPasswordValues = { newPassword: '', confirmPassword: '' }

export function AccountPasswordCard({
  onSave,
  value,
  onChange,
  hideSubmitButton = false,
  submitLabel,
  onDirtyChange,
  baseline = DEFAULT_BASELINE,
}: AccountPasswordCardProps) {
  const [internalState, setInternalState] = useState<AccountPasswordValues>({ newPassword: '', confirmPassword: '' })
  const [isSaving, setIsSaving] = useState(false)

  const formState = value ?? internalState

  useEffect(() => {
    if (value) {
      setInternalState(value)
    }
  }, [value])

  useEffect(() => {
    const target = baseline ?? DEFAULT_BASELINE
    onDirtyChange?.(
      formState.newPassword !== target.newPassword || formState.confirmPassword !== target.confirmPassword,
    )
  }, [baseline, formState, onDirtyChange])

  const updateState = (next: AccountPasswordValues) => {
    if (!value) {
      setInternalState(next)
    }
    onChange?.(next)
  }
  const handleSave = async () => {
    if (!onSave) {
      return
    }
    setIsSaving(true)
    try {
      const result = await onSave(formState)
      if (result !== false && !value) {
        setInternalState({ newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Failed to update password', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Change password</h2>
        <p className="text-sm text-[var(--color-muted)]">Create a strong password that you haven’t used before.</p>
      </div>
      <Field label="New password" required>
        <div className={fieldContainer}>
          <input
            type="password"
            className={fieldInput}
            value={formState.newPassword}
            onChange={(event) => updateState({ ...formState, newPassword: event.target.value })}
          />
        </div>
      </Field>
      <Field label="Confirm new password" required>
        <div className={fieldContainer}>
          <input
            type="password"
            className={fieldInput}
            value={formState.confirmPassword}
            onChange={(event) => updateState({ ...formState, confirmPassword: event.target.value })}
          />
        </div>
      </Field>
      {hideSubmitButton ? null : (
        <div className="flex justify-end">
          <BasicButton
            params={{
              variant: 'secondary',
              onClick: handleSave,
              disabled: isSaving,
            }}
          >
            {isSaving ? 'Saving...' : submitLabel ?? 'Save password'}
          </BasicButton>
        </div>
      )}
    </section>
  )
}
