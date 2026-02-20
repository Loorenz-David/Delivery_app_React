import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import type { Phone } from '@/types/phone'
import { phonePrefixes } from './phonePrefixes'
import type { PhonePrefixOption } from './phonePrefixes'

type PhoneFieldControllerProps = {
  phoneNumber: Phone
  onChange: (value: Phone) => void
}

export const usePhoneFieldControllers = ({
  phoneNumber,
  onChange,
}: PhoneFieldControllerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectedPrefix = useMemo(
    () => phonePrefixes.find((option) => option.value === phoneNumber.prefix) ?? null,
    [phoneNumber.prefix],
  )

  const filteredPrefixes = useMemo(() => {
    const normalized = inputValue.trim().toLowerCase()
    if (!normalized) return phonePrefixes
    return phonePrefixes.filter((option) =>
      option.countryName.toLowerCase().includes(normalized) || option.value.includes(normalized) || option.display.toLowerCase().includes(normalized),
    )
  }, [inputValue])

  useEffect(() => {
    if (isOpen) return
    setInputValue(selectedPrefix?.display ?? phoneNumber.prefix)
  }, [isOpen, phoneNumber.prefix, selectedPrefix?.display])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        setInputValue(selectedPrefix?.display ?? phoneNumber.prefix)
        inputRef.current?.blur()
      }
    },
    [phoneNumber.prefix, selectedPrefix?.display],
  )

  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setIsOpen(true)
  }, [])

  const handleSelectPrefix = useCallback(
    (prefixOption: PhonePrefixOption) => {
      onChange({ ...phoneNumber, prefix: prefixOption.value })
      setInputValue(prefixOption.display)
      requestAnimationFrame(() => {
        setIsOpen(false)
        inputRef.current?.blur()
      })
    },
    [onChange, phoneNumber],
  )

  const handleNumberChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...phoneNumber, number: event.target.value })
    },
    [onChange, phoneNumber],
  )

  return {
    inputRef,
    isOpen,
    inputValue,
    selectedPrefix,
    filteredPrefixes,
    handleOpenChange,
    handleInputFocus,
    handleInputChange,
    handleSelectPrefix,
    handleNumberChange,
  }
}
