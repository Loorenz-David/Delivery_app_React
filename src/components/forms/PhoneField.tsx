import { useCallback, useEffect, useMemo } from 'react'

import { Field } from './FieldContainer'
import { DropDown } from '../buttons/DropDown'
import {
  DEFAULT_PREFIX,
  PHONE_PREFIX_INDEX_STORAGE_KEY,
  PHONE_PREFIX_STORAGE_KEY,
  phonePrefixOptions,
} from '../../constants/dropDownOptions'


export interface PhoneValue {
  prefix: string
  number: string
}

const fieldContainer = 'custom-field-container'
const fieldInput = 'custom-input'

type PhoneFieldProps = {
  label: string
  value: PhoneValue
  onChange: (value: PhoneValue) => void
  required?: boolean
}

export function PhoneField({ label, value, onChange, required = false }: PhoneFieldProps) {
  const defaultIndex = useMemo(() => {
    const index = phonePrefixOptions.findIndex((option) => option.value === DEFAULT_PREFIX)
    return index >= 0 ? index : 0
  }, [])

  const persistSelection = useCallback(
    (prefix: string) => {
      if (typeof window === 'undefined') {
        return
      }
      const nextIndex = phonePrefixOptions.findIndex((option) => option.value === prefix)
      window.localStorage.setItem(PHONE_PREFIX_STORAGE_KEY, prefix)
      window.localStorage.setItem(
        PHONE_PREFIX_INDEX_STORAGE_KEY,
        String(nextIndex >= 0 ? nextIndex : defaultIndex),
      )
    },
    [defaultIndex],
  )

  const ensureStoredPrefix = useCallback(() => {
    const fallback = { prefix: DEFAULT_PREFIX, index: defaultIndex }
    if (typeof window === 'undefined') {
      return fallback
    }
    const storedPrefix = window.localStorage.getItem(PHONE_PREFIX_STORAGE_KEY)
    const storedIndexRaw = window.localStorage.getItem(PHONE_PREFIX_INDEX_STORAGE_KEY)
    let index = fallback.index

    if (storedIndexRaw != null) {
      const parsed = Number.parseInt(storedIndexRaw, 10)
      index = Number.isNaN(parsed) ? fallback.index : parsed
    } else {
      const derivedIndex = storedPrefix
        ? phonePrefixOptions.findIndex((option) => option.value === storedPrefix)
        : fallback.index
      index = derivedIndex >= 0 ? derivedIndex : fallback.index
      window.localStorage.setItem(PHONE_PREFIX_INDEX_STORAGE_KEY, String(index))
    }

    const prefix = storedPrefix ?? fallback.prefix
    if (!storedPrefix) {
      window.localStorage.setItem(PHONE_PREFIX_STORAGE_KEY, prefix)
    }

    return { prefix, index }
  }, [defaultIndex])

  const handlePrefixChange = useCallback(
    (next: string) => {
      persistSelection(next)
      onChange({ prefix: next, number: value.number })
    },
    [onChange, persistSelection, value.number],
  )

  useEffect(() => {
    const storedPreference = ensureStoredPrefix()
    if (!storedPreference) {
      return
    }
    if (value.prefix !== DEFAULT_PREFIX) {
      return
    }
    if (value.prefix === storedPreference.prefix) {
      return
    }
    onChange({ prefix: storedPreference.prefix, number: value.number })
  }, [ensureStoredPrefix, onChange, value.number, value.prefix])

  return (
    <Field label={label} required={required}>
      
      <div className={fieldContainer}>
        <DropDown
          buttonClassName=" items-center justify-between"
          options={phonePrefixOptions}
          className="max-w-[120px]"
          state={[value.prefix, (next) => handlePrefixChange(String(next))]}
        />
        <input
          type="tel"
          className={`${fieldInput} flex-1`}
          value={value.number}
          onChange={(event) => onChange({ ...value, number: event.target.value })}
        />
      </div>
    </Field>
  )
}
