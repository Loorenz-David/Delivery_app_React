import { useCallback, useEffect, useMemo } from 'react'

import { Field } from './FieldContainer'
import { DropDown } from '../buttons/DropDown'
import {
  DEFAULT_PREFIX,
  PHONE_PREFIX_INDEX_STORAGE_KEY,
  PHONE_PREFIX_STORAGE_KEY,
  phonePrefixOptions,
} from '../../constants/dropDownOptions'

const PHONE_PREFIX_DETECTED_KEY = 'defaultPhonePrefixDetected'

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

  const resolveRegionCode = useCallback(() => {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || ''
      const match = locale.match(/[-_]([A-Za-z]{2,3})(?:-|$)/)
      return match ? match[1].toUpperCase() : null
    } catch (error) {
      console.warn('Failed to resolve region code from locale', error)
      return null
    }
  }, [])

  const findPrefixForRegion = useCallback(
    (regionCode: string | null) => {
      if (!regionCode) return null
      try {
        const displayNames = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' })
        const regionName = displayNames.of(regionCode)
        if (!regionName) return null
        const match = phonePrefixOptions.find((option) =>
          option.display.toLowerCase().includes(regionName.toLowerCase()),
        )
        return match?.value ?? null
      } catch (error) {
        console.warn('Failed to map region to country prefix', error)
        return null
      }
    },
    [],
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const hasDetectedPrefix = window.localStorage.getItem(PHONE_PREFIX_DETECTED_KEY) === 'true'
    if (hasDetectedPrefix) {
      return
    }
    if (value.prefix !== DEFAULT_PREFIX) {
      return
    }
    const storedPrefix = window.localStorage.getItem(PHONE_PREFIX_STORAGE_KEY)
    if (storedPrefix && storedPrefix !== DEFAULT_PREFIX) {
      return
    }
    const regionCode = resolveRegionCode()
    const regionPrefix = findPrefixForRegion(regionCode)
    if (!regionPrefix || regionPrefix === value.prefix) {
      return
    }
    persistSelection(regionPrefix)
    window.localStorage.setItem(PHONE_PREFIX_DETECTED_KEY, 'true')
    onChange({ prefix: regionPrefix, number: value.number })
  }, [findPrefixForRegion, onChange, persistSelection, resolveRegionCode, value.number, value.prefix])

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
