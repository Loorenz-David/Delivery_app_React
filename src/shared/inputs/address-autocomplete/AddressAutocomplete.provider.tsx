import type { ReactNode } from 'react'
import type{ address } from '@/types/address'
import type { ComponentRestrictions } from '@/shared/google-maps/types'
import { useGoogleAutoComplete } from './hooks/useGoogleAutoComplete'
import { useControllers } from './hooks/useController'
import { AddressAutocompleteContext } from './AddressAutocomplete.context'

type AddressAutocompleteProviderProps = {
  children: ReactNode
  onSelectedAddress: (value: address | null ) => void
  selectedAddress: address | null | undefined
  componentRestrictions?: ComponentRestrictions
}

export const AddressAutocompleteProvider = ({
  children,
  componentRestrictions,
  onSelectedAddress,
  selectedAddress
}: AddressAutocompleteProviderProps) => {

  const googleAutoComplete = useGoogleAutoComplete({ componentRestrictions })
  const predictions = googleAutoComplete.predictions
  const controllers = useControllers({
    fetchPredictions: googleAutoComplete.fetchPredictions,
    resetPredictions: googleAutoComplete.resetPredictions,
    getPlaceDetails: googleAutoComplete.getPlaceDetails,
    onSelectedAddress: onSelectedAddress,
    selectedAddress: selectedAddress
  })


  const value = {
    isLoading: predictions.isLoading,
    suggestions: predictions.suggestions,
    ...googleAutoComplete,
    ...controllers,
  }

  return (
    <AddressAutocompleteContext.Provider value={value}>
      {children}
    </AddressAutocompleteContext.Provider>
  )
}
