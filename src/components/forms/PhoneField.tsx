import { useCallback, useEffect, useMemo } from 'react'

import { Field } from './FieldContainer'
import { DropDown } from '../buttons/DropDown'
import type { Phone } from '@/types/phone'
import {
  DEFAULT_PREFIX,
  PHONE_PREFIX_INDEX_STORAGE_KEY,
  PHONE_PREFIX_STORAGE_KEY,
  phonePrefixOptions,
} from '../../constants/dropDownOptions'

const PHONE_PREFIX_DETECTED_KEY = 'defaultPhonePrefixDetected'
const fieldContainer = 'custom-field-container'
const fieldInput = 'custom-input'



type PhoneFieldProps = {
  label: string
  value: Phone
  onChange: (value: Phone) => void
  required?: boolean
}

export type PhoneValue = Phone

const isBrowser = typeof window !== 'undefined'

const normalizeIndex = (index: number) => (index >= 0 ? index : 0)

const getDefaultIndex = () =>
  normalizeIndex(phonePrefixOptions.findIndex((option) => option.value === DEFAULT_PREFIX))

const resolveRegionCode = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || ''
    const match = locale.match(/[-_]([A-Za-z]{2,3})(?:-|$)/)
    return match ? match[1].toUpperCase() : null
  } catch (error) {
    console.warn('Failed to resolve region code from locale', error)
    return null
  }
}

const findPrefixForRegion = (regionCode: string | null) => {
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
}

export function PhoneField({ label, value, onChange, required = false }: PhoneFieldProps) {
  const defaultIndex = useMemo(getDefaultIndex, [])

  const persistSelection = useCallback(
    (prefix: string) => {
      if (!isBrowser) return
      const nextIndex = normalizeIndex(
        phonePrefixOptions.findIndex((option) => option.value === prefix),
      )
      window.localStorage.setItem(PHONE_PREFIX_STORAGE_KEY, prefix)
      window.localStorage.setItem(PHONE_PREFIX_INDEX_STORAGE_KEY, String(nextIndex))
    },
    [defaultIndex],
  )

  const ensureStoredPrefix = useCallback(() => {
    const fallback = { prefix: DEFAULT_PREFIX, index: defaultIndex }
    if (!isBrowser) return fallback

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
      index = normalizeIndex(derivedIndex)
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
    if (value.prefix !== DEFAULT_PREFIX) return
    const storedPreference = ensureStoredPrefix()
    if (value.prefix === storedPreference.prefix) return
    onChange({ prefix: storedPreference.prefix, number: value.number })
  }, [ensureStoredPrefix, onChange, value.number, value.prefix])

  useEffect(() => {
    if (!isBrowser) return
    if (value.prefix !== DEFAULT_PREFIX) return
    const hasDetectedPrefix = window.localStorage.getItem(PHONE_PREFIX_DETECTED_KEY) === 'true'
    if (hasDetectedPrefix) return

    const storedPrefix = window.localStorage.getItem(PHONE_PREFIX_STORAGE_KEY)
    if (storedPrefix && storedPrefix !== DEFAULT_PREFIX) return

    const regionPrefix = findPrefixForRegion(resolveRegionCode())
    if (!regionPrefix || regionPrefix === value.prefix) return

    persistSelection(regionPrefix)
    window.localStorage.setItem(PHONE_PREFIX_DETECTED_KEY, 'true')
    onChange({ prefix: regionPrefix, number: value.number })
  }, [onChange, persistSelection, value.number, value.prefix])

  return (
    <Field label={label} required={required}>
      
      <div className={fieldContainer}>
        <DropDown
          buttonClassName=" items-center justify-between"
          options={phonePrefixOptions}
          className="max-w-[140px]"
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
