import { useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { useInputWarning } from '../../../../components/forms/useInputWarning'

export interface DropdownOption {
  display: string
  value: string
}

interface DropdownOptionsEditorProps {
  value: DropdownOption[]
  onChange: (options: DropdownOption[]) => void
}

export function DropdownOptionsEditor({ value, onChange }: DropdownOptionsEditorProps) {
  const [draft, setDraft] = useState<DropdownOption>({ display: '', value: '' })
  const displayWarning = useInputWarning('Label is required.')
  const valueWarning = useInputWarning('Value is required.')

  const handleAdd = () => {
    if (!draft.display.trim()) {
      displayWarning.showWarning()
      return
    }
    if (!draft.value.trim()) {
      valueWarning.showWarning()
      return
    }
    displayWarning.hideWarning()
    valueWarning.hideWarning()
    const next = [...value, { display: draft.display.trim(), value: draft.value.trim() }]
    onChange(next)
    setDraft({ display: '', value: '' })
  }

  const handleRemove = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">Dropdown options</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Label" warningController={displayWarning}>
          <InputField
            value={draft.display}
            onChange={(event) => setDraft((prev) => ({ ...prev, display: event.target.value }))}
          />
        </Field>
        <Field label="Value" warningController={valueWarning}>
          <InputField value={draft.value} onChange={(event) => setDraft((prev) => ({ ...prev, value: event.target.value }))} />
        </Field>
      </div>
      <BasicButton
        params={{
          variant: 'secondary',
          onClick: handleAdd,
        }}
      >
        Add option
      </BasicButton>
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((option, index) => (
            <div
              key={`${option.value}-${index}`}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{option.display}</span>
                <span className="text-xs text-[var(--color-muted)]">{option.value}</span>
              </div>
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                onClick={() => handleRemove(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">No options added yet.</p>
      )}
    </div>
  )
}
