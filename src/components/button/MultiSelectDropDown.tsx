import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ChevronDownIcon } from '../../assets/icons'

export interface MultiSelectOption {
  value: any
  display: ReactNode
}

interface MultiSelectDropDownProps {
  options: MultiSelectOption[]
  selected: any[]
  onChange: (next: any[]) => void
  placeholder?: string
}

export function MultiSelectDropDown({ options, selected, onChange, placeholder = 'Select options' }: MultiSelectDropDownProps) {
  const [open, setOpen] = useState(false)

  const summary = useMemo(() => {
    if (!selected.length) return placeholder
    if (selected.length === 1) {
      const match = options.find((opt) => opt.value === selected[0])
      if (match) {
        return typeof match.display === 'string' ? match.display : '1 selected'
      }
    }
    return `${selected.length} selected`
  }, [options, placeholder, selected])

  const toggle = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((id) => id !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selected.length === 0 ? 'text-[var(--color-muted)]' : ''}>{summary}</span>
        <ChevronDownIcon className={`app-icon h-4 w-4 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
          {options.map((opt) => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-accent)] ${active ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text)]'}`}
                onClick={() => toggle(opt.value)}
              >
                <span className="flex-1 truncate text-left">{opt.display}</span>
                <span className={`text-[var(--color-primary)] ${!active ? 'text-transparent' : ''}`}>✓</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
