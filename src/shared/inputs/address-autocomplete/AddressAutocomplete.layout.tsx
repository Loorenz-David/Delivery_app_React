import type { CSSProperties } from 'react'
import { CurrentLocationIcon } from '@/assets/icons'
import { FloatingPopover }  from '@/shared/popups/FloatingPopover/FloatingPopover'
import { InputField } from '@/shared/inputs/InputField'

import {  SuggestionsSelector } from './SuggestionSelector'
import { useAddressAutocompleteContext } from './AddressAutocomplete.context'
import { isAddressCurrentLocation } from './utils/isAddressCurrentLocation'
import { CURRENT_LOCATION_INPUT_LABEL } from './constants/location.constants'


type AddressAutocompleteLayoutProps = {
    fieldClassName?: string
    inputClassName?: string
    inputStyle?: CSSProperties
    placeholder?: string
}

export const AddressAutocompleteLayout = ({
    fieldClassName,
    inputClassName,
    inputStyle,
    placeholder,
}: AddressAutocompleteLayoutProps) => {

    const { isOpen,
         handleToogle,
         handleInputChange,
         inputValue,
         selectedAddress,
         handleBeginManualEntryFromCurrentLocation,
    } = useAddressAutocompleteContext()

    const isCurrentLocationMode = Boolean(selectedAddress && isAddressCurrentLocation(selectedAddress))
    const displayedValue = isCurrentLocationMode ? CURRENT_LOCATION_INPUT_LABEL : inputValue

    return ( 
        <FloatingPopover
            open={ isOpen }
            onOpenChange={ ()=> handleToogle({value: false}) }
            classes={'relative'}
            matchReferenceWidth={ true }
            removeFlip={ true }
            reference={
                <div className="relative flex">
                    {isCurrentLocationMode ? (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]">
                        <CurrentLocationIcon className="h-4 w-4 text-[var(--color-dark-blue)]" />
                      </span>
                    ) : null}
                    <InputField
                        onChange={ handleInputChange }
                        onFocus={ ()=> {
                          if (isCurrentLocationMode) {
                            handleBeginManualEntryFromCurrentLocation()
                          }
                          handleToogle({ value: true })
                        } }
                        fieldClassName={fieldClassName}
                        inputClassName={[inputClassName, isCurrentLocationMode ? 'pl-6' : null].filter(Boolean).join(' ')}
                        style={inputStyle}
                        value={displayedValue}
                        placeholder={placeholder}
                    />
                </div>
            }
        >
            <div className="bg-[var(--color-page)] border border-[var(--color-border-accent)] rounded-lg shadow-lg p-2">
                <SuggestionsSelector />
            </div>
        </FloatingPopover>
    );
}
