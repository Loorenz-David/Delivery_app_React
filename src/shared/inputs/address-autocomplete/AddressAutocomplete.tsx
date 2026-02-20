import { AddressAutocompleteProvider } from './AddressAutocomplete.provider'
import { AddressAutocompleteLayout } from './AddressAutocomplete.layout'
import type{ address } from '@/types/address'

type PropsAddressAutocomplete = {
    onSelectedAddress: (value: address | null ) => void
    selectedAddress: address | null | undefined
}
export const AddressAutocomplete = ({
    onSelectedAddress,
    selectedAddress
}:PropsAddressAutocomplete)=>{

    return(
        <AddressAutocompleteProvider onSelectedAddress={ onSelectedAddress } selectedAddress={ selectedAddress }>
            <AddressAutocompleteLayout/>
        </AddressAutocompleteProvider>
    )
}