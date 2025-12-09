import { useEffect, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { PhoneField, type PhoneValue } from '../../../../components/forms/PhoneField'
import { BasicButton } from '../../../../components/buttons/BasicButton'

export interface AccountDetailsValues {
  username: string
  email: string
  phone: PhoneValue
}

interface AccountDetailsCardProps {
  initialValues: AccountDetailsValues
  onSave?: (values: AccountDetailsValues) => Promise<void> | void
  submitLabel?: string
  onChange?: (values: AccountDetailsValues) => void
  onDirtyChange?: (dirty: boolean) => void
}

const fieldContainer = 'custom-field-container'
const fieldInput = 'custom-input'

export function AccountDetailsCard({
  initialValues,
  onSave,
  submitLabel,
  onChange,
  onDirtyChange,
}: AccountDetailsCardProps) {
  const [formState, setFormState] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormState(initialValues)
  }, [initialValues.email, initialValues.phone.number, initialValues.phone.prefix, initialValues.username])

  useEffect(() => {
    onChange?.(formState)
    const isDirty =
      formState.username !== initialValues.username ||
      formState.email !== initialValues.email ||
      formState.phone.prefix !== initialValues.phone.prefix ||
      formState.phone.number !== initialValues.phone.number
    onDirtyChange?.(isDirty)
  }, [formState, initialValues, onChange, onDirtyChange])

  const handleSave = async () => {
    if (!onSave) {
      return
    }
    setIsSaving(true)
    try {
      await onSave(formState)
    } catch (error) {
      console.error('Failed to save account details', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Contact details</h2>
        <p className="text-sm text-[var(--color-muted)]">Keep your teammates up to date with how to reach you.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Username" required>
          <div className={fieldContainer}>
            <input
              className={fieldInput}
              value={formState.username}
              onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
            />
          </div>
        </Field>
        <Field label="Email" required>
          <div className={fieldContainer}>
            <input
              type="email"
              className={fieldInput}
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
        </Field>
      </div>

      <PhoneField
        label="Phone number"
        value={formState.phone}
        onChange={(next) =>
          setFormState((prev) => ({
            ...prev,
            phone: next,
          }))
        }
        required
      />

      <div className="flex justify-end">
        <BasicButton
          params={{
            variant: 'primary',
            onClick: handleSave,
            disabled: isSaving,
          }}
        >
          {isSaving ? 'Saving...' : submitLabel ?? 'Save changes'}
        </BasicButton>
      </div>
    </section>
  )
}
