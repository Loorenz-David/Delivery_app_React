

import { usePlacesAPIServices } from '@/shared/google-maps/hooks/usePlacesAPIServices'
import { usePredictionCall } from './usePredictionCall'
import { usePlacesCall } from './usePlacesCall'

import type { ComponentRestrictions } from '../../types'

type PropsUsePlacesAutoComplete = {
    componentRestrictions?: ComponentRestrictions
}

export const useGoogleAutoComplete = ({
    componentRestrictions
}: PropsUsePlacesAutoComplete)=>{
    const { ensureServices } = usePlacesAPIServices()
    const { fetchPredictions, resetPredictions, predictions } = usePredictionCall({ ensureServices, componentRestrictions })
    const { getPlaceDetails } = usePlacesCall({ ensureServices })
   
    return {
        predictions,
        fetchPredictions, 
        resetPredictions,
        getPlaceDetails,
    }

}
