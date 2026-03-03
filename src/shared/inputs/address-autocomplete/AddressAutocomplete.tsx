import { AddressAutocompleteProvider } from './AddressAutocomplete.provider'
import { AddressAutocompleteLayout } from './AddressAutocomplete.layout'
import type { CSSProperties } from 'react'
import type{ address } from '@/types/address'

type PropsAddressAutocomplete = {
    onSelectedAddress: (value: address | null ) => void
    selectedAddress: address | null | undefined
    fieldClassName?: string
    inputClassName?: string
    inputStyle?: CSSProperties
}
export const AddressAutocomplete = ({
    onSelectedAddress,
    selectedAddress,
    fieldClassName,
    inputClassName,
    inputStyle,
}:PropsAddressAutocomplete)=>{

    return(
        <AddressAutocompleteProvider onSelectedAddress={ onSelectedAddress } selectedAddress={ selectedAddress }>
            <AddressAutocompleteLayout
                fieldClassName={fieldClassName}
                inputClassName={inputClassName}
                inputStyle={inputStyle}
            />
        </AddressAutocompleteProvider>
    )
}
