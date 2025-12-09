import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

import { MapPinIcon, LoaderIcon, LocationIcon } from '../../assets/icons'

import type { InputWarningController } from '../../components/forms/useInputWarning'
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete'

import type { PlaceSuggestion } from '../hooks/usePlacesAutocomplete'
import type { AddressPayload } from '../../features/home/types/backend'
import { useResourceManager } from '../../resources_manager/resourcesManagerContext'
import type { MapLocationPickerPayload } from './LocationPickerPopup'

import { invalidStyles, fieldContainer } from '../../constants/classes'

interface AddressAutocompleteProps {
  placeholder?: string
  onAddressSelected: (address: AddressPayload) => void
  onAddressCleared?: () => void
  existingAddress?: AddressPayload | null
  warningController?: InputWarningController
  leadingIcon?: ReactNode
  rightAdornment?: ReactNode
  externalValue?: string
  onInputFocus?: () => void
  onInputBlur?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  enableManualPicker?: boolean
}




export function AddressAutocomplete({
  placeholder = 'Search address',
  onAddressSelected,
  onAddressCleared,
  existingAddress,
  warningController,
  leadingIcon,
  rightAdornment,
  externalValue,
  onInputFocus,
  onInputBlur,
  inputRef,
  enableManualPicker = false,
}: AddressAutocompleteProps) {
  const popupManager = useResourceManager('popupManager')
  const { warning, hideWarning, showWarning } = warningController ?? {}
  const isInvalid = Boolean(warning?.isVisible)

  const [inputValue, setInputValue] = useState(existingAddress?.raw_address ?? '')
  const [hasValidSelection, setHasValidSelection] = useState(Boolean(existingAddress))
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  const { predictions, setQuery, query, getPlaceDetails, resetPredictions } = usePlacesAutocomplete()
  const dropdownRef = useRef<HTMLUListElement>(null)

  const suggestions = predictions.suggestions

  const handleMapSelection = useCallback(
    (address: AddressPayload) => {
      setInputValue(address.raw_address ?? '')
      setHasValidSelection(true)
      hideWarning?.()
      onAddressSelected(address)
      resetPredictions()
      setQuery('')
      setIsDropdownVisible(false)
    },
    [hideWarning, onAddressSelected, resetPredictions, setQuery],
  )

  const openMapPicker = useCallback(() => {
    const payload: MapLocationPickerPayload = {
      initialAddress: existingAddress ?? null,
      onConfirm: handleMapSelection,
    }
    popupManager.open({
      key: 'MapLocationPicker',
      payload,
      parentParams: {
        title: 'Pick location on map',
      },
    })
  }, [existingAddress, handleMapSelection, popupManager])

  useEffect(() => {
    setInputValue(existingAddress?.raw_address ?? '')
    setHasValidSelection(Boolean(existingAddress))
    if (existingAddress) {
      hideWarning?.()
    }
  }, [existingAddress, hideWarning])

  useEffect(() => {
    if (existingAddress) {
      return
    }
    if (externalValue !== undefined) {
      setInputValue(externalValue)
      setHasValidSelection(Boolean(externalValue))
      if (externalValue) {
        hideWarning?.()
      }
      setQuery('')
    }
  }, [existingAddress, externalValue, hideWarning, setQuery])

  useEffect(() => {
    setIsDropdownVisible(Boolean(query) && (Boolean(suggestions.length) || predictions.isLoading))
  }, [predictions.isLoading, query, suggestions.length])

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      try {
        const addressDetails = await getPlaceDetails(suggestion.placeId)
        setInputValue(suggestion.description)
        setHasValidSelection(true)
        hideWarning?.()
        onAddressSelected(addressDetails)
        resetPredictions()
        setQuery('')
        setIsDropdownVisible(false)
      } catch (error) {
        console.error('Failed to select place', error)
        showWarning?.('Unable to fetch address. Please try another option.')
      }
    },
    [getPlaceDetails, hideWarning, onAddressSelected, resetPredictions, setQuery, showWarning],
  )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setQuery(value)
    setHasValidSelection(false)
    hideWarning?.()
  }

  const handleBlur = () => {
    onInputBlur?.()
    requestAnimationFrame(() => {
      if (dropdownRef.current?.contains(document.activeElement)) {
        return
      }

      setIsDropdownVisible(false)

      if (!inputValue.trim()) {
        onAddressCleared?.()
        return
      }

      if (!hasValidSelection) {
        onAddressCleared?.()
        showWarning?.('Please choose an address from the dropdown.')
      }
    })
  }

  const handleFocus = () => {
    onInputFocus?.()
    if (suggestions.length || predictions.isLoading) {
      setIsDropdownVisible(true)
    }
  }

  const dropdownContent = useMemo(() => {
    if (!isDropdownVisible) {
      return null
    }

    if (predictions.isLoading) {
      return (
        <li className="flex items-center gap-2 px-3 py-3 text-sm text-[var(--color-muted)]">
          <LoaderIcon className="app-icon h-4 w-4 animate-spin" />
          Loading suggestions...
        </li>
      )
    }

    if (!suggestions.length) {
      return (
        <li className="px-3 py-3 text-sm text-[var(--color-muted)]">No matches. Try refining your search.</li>
      )
    }

    return suggestions.map((suggestion) => (
      <li key={suggestion.placeId}>
        <button
          type="button"
          className="flex w-full flex-col gap-0.5 px-3 py-3 text-left text-sm hover:bg-[var(--color-page)]"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleSelectSuggestion(suggestion)}
        >
          <span className="font-medium text-[var(--color-text)]">{suggestion.mainText ?? suggestion.description}</span>
          {suggestion.secondaryText && (
            <span className="text-xs text-[var(--color-muted)]">{suggestion.secondaryText}</span>
          )}
        </button>
      </li>
    ))
  }, [handleSelectSuggestion, isDropdownVisible, predictions.isLoading, suggestions])

  const mapPickerButton = enableManualPicker ? (
    <button
      type="button"
      className="cursor-pointer ml-2 flex h-8 w-8 items-center justify-center border border-gray-300 rounded-md text-[var(--color-muted)] transition hover:bg-[var(--color-accent)]"
      onClick={(event) => {
        event.preventDefault()
        openMapPicker()
      }}
      onMouseDown={(event) => event.preventDefault()}
      aria-label="Pick location on map"
    >
      <MapPinIcon className="app-icon h-5 w-5" />
    </button>
  ) : null

  const hasAdornment = enableManualPicker || Boolean(rightAdornment)

  return (
    <div className={`relative ${isDropdownVisible ? 'z-20' : ''}`}>
      <div className={`${fieldContainer} ${isInvalid ? invalidStyles : ''}`}>
        {leadingIcon ?? <LocationIcon className="app-icon h-4 w-4 text-[var(--color-muted)]" />}
        <input
          type="text"
          className={`custom-input ${isInvalid ? 'placeholder-red-400' : ''}`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isInvalid}
          ref={inputRef}
        />
        {hasAdornment ? (
          <div className="flex items-center gap-1">
            {mapPickerButton}
            {rightAdornment}
          </div>
        ) : null}
      </div>
      {isDropdownVisible && (
        <ul
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 max-h-60 overflow-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-xl"
        >
          {dropdownContent}
        </ul>
      )}
    </div>
  )
}
