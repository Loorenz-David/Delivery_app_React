import type { CSSProperties } from 'react'
import { FloatingPopover }  from '@/shared/popups/FloatingPopover/FloatingPopover'
import { InputField } from '@/shared/inputs/InputField'

import {  SuggestionsSelector } from './SuggestionSelector'
import { useAddressAutocompleteContext } from './AddressAutocomplete.context'


type AddressAutocompleteLayoutProps = {
    fieldClassName?: string
    inputClassName?: string
    inputStyle?: CSSProperties
}

export const AddressAutocompleteLayout = ({
    fieldClassName,
    inputClassName,
    inputStyle,
}: AddressAutocompleteLayoutProps) => {

    const { isOpen,
         handleToogle,
         handleInputChange,
         inputValue 
    } = useAddressAutocompleteContext()

    return ( 
        <FloatingPopover
            open={ isOpen }
            onOpenChange={ ()=> handleToogle({value: false}) }
            classes={'relative'}
            matchReferenceWidth={ true }
            removeFlip={ true }
            reference={
                <div className="flex">
                    <InputField value={ inputValue } 
                        onChange={ handleInputChange }
                        onFocus={ ()=> handleToogle({ value: true }) }
                        fieldClassName={fieldClassName}
                        inputClassName={inputClassName}
                        style={inputStyle}
                    />
                </div>
            }
        >
            <div className="bg-[var(--color-page)] border border-[var(--color-border)] rounded-lg shadow-lg p-2">
                <SuggestionsSelector />
            </div>
        </FloatingPopover>
    );
}
