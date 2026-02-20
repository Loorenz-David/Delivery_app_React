import { FloatingPopover }  from '@/shared/popups/FloatingPopover/FloatingPopover'
import { InputField } from '@/shared/inputs/InputField'

import {  SuggestionsSelector } from './SuggestionSelector'
import { useAddressAutocompleteContext } from './AddressAutocomplete.context'


export const AddressAutocompleteLayout = () => {

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

