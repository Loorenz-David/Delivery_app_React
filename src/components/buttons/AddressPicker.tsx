import { useEffect, useMemo, useRef, useState } from 'react'

import { ChevronDownIcon, LocationIcon } from '../../assets/icons'

import { AddressAutocomplete } from '../../google_maps/components/AddressAutocomplete'

import type { InputWarningController } from '../forms/useInputWarning'
import type { AddressPayload } from '../../features/home/types/backend'

export interface AddressPickerOption {
  label: string
  value: AddressPayload
}

interface AddressPickerProps<FieldName extends string = string> {
  field: FieldName
  selection: AddressPayload | null
  options: AddressPickerOption[]
  onSelectionChange: (field: FieldName, selection: AddressPayload | null) => void
  placeholder?: string
  warningController?: InputWarningController
  enableManualPicker?: boolean
}

export function AddressPicker<FieldName extends string = string>({
  field,
  selection,
  options,
  onSelectionChange,
  placeholder = 'Search address',
  warningController,
  enableManualPicker = true,
}: AddressPickerProps<FieldName>) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const skipClearRef = useRef(false)

  const presetLabel = selection?.raw_address ?? ''
  const displayOptions = useMemo(() => options ?? [], [options])
  const existingAddress = selection 

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

 

  const handlePresetSelect = (value: AddressPayload) => {
    skipClearRef.current = true
    onSelectionChange(field, value)
    setIsDropdownOpen(false)
    inputRef.current?.blur()
  }

  const handleAddressSelected = (value: AddressPayload) => {
    skipClearRef.current = true
    onSelectionChange(field, value)
    setIsDropdownOpen(false)
  }

  const handleAddressCleared = () => {
    if (skipClearRef.current) {
      skipClearRef.current = false
      return
    }
    onSelectionChange(field, null)
  }

  const arrowButton = (
    <button
      type="button"
      className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-page)]"
      onClick={(event) => {
        event.preventDefault()
        inputRef.current?.blur()
        setIsDropdownOpen((prev) => !prev)
      }}
      onMouseDown={(event) => event.preventDefault()}
      aria-label="Open locations list"
    >
      <ChevronDownIcon className={`app-icon h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
    </button>
  )
  
  return (
    <div ref={containerRef} className="relative">
      <AddressAutocomplete
        placeholder={placeholder}
        onAddressSelected={handleAddressSelected}
        onAddressCleared={handleAddressCleared}
        existingAddress={existingAddress}
        warningController={warningController}
        leadingIcon={<LocationIcon className="app-icon h-4 w-4 text-[var(--color-muted)]" />}
        rightAdornment={arrowButton}
        externalValue={presetLabel}
        onInputFocus={() => setIsDropdownOpen(false)}
        inputRef={inputRef}
        enableManualPicker={enableManualPicker}
      />

      {isDropdownOpen && (
        <ul className="absolute left-0 z-2 right-0 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-xl">
          {displayOptions.map((option, index) => {
            const isSelected = selection?.raw_address === option.value.raw_address
            return (
              <li key={`address-option-${field}-${index}`}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-accent)] ${
                    isSelected ? 'font-medium text-[var(--color-text)]' : ''
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handlePresetSelect(option.value)}
                >
                  <span className="flex-1 truncate">{option.label ?? option.value.raw_address}</span>
                  <span className={`${isSelected ? 'text-[var(--color-primary)]' : 'text-transparent'}`}>✓</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
