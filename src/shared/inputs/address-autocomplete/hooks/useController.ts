import { useRef, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import type {address} from '@/types/address'
import type { PlaceSuggestion } from '@/shared/google-maps/types'




type PropsuseController = {
    resetPredictions: ()=> void
    fetchPredictions: (value:string) => void
    getPlaceDetails: (value: string) => Promise<address>
    onSelectedAddress: (value: address | null ) => void
    selectedAddress: address | null | undefined
}
export const useControllers = ({
    resetPredictions,
    fetchPredictions,
    getPlaceDetails,
    onSelectedAddress,
    selectedAddress
}: PropsuseController) => {

    const debounceMs = 500
    const debounceTimeoutRef = useRef<number | null>(null)
    const [ inputValue, setInputValue ] = useState('')
    const [ isOpen, setIsOpen ] = useState(false)

    const onQuery = (value: string)=>{

        if (debounceTimeoutRef.current !== null) {
            window.clearTimeout(debounceTimeoutRef.current)
        }

        if (!value.trim()){
            resetPredictions()
            return
        }

        
        debounceTimeoutRef.current = window.setTimeout(() => {
            fetchPredictions(value)
            if( selectedAddress ){
                onSelectedAddress(null)
            }
        }, debounceMs)

    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>, query = true )=>{
        const value = event.target.value
        
        setInputValue( value )
        if (value.trim() == ''){
            onSelectedAddress(null)
        }

        if( query ){
            onQuery( value )
        }
    }

    async function handleSelectionAddress (suggestion: PlaceSuggestion) {
        const addressDetails = await getPlaceDetails(suggestion.placeId)
        setInputValue( addressDetails.street_address )
        onSelectedAddress( addressDetails )
    }
    
    const handleToogle = ({
        value = null, 
    }: {value?: boolean | null } )=>{

        if( !selectedAddress ){
            setInputValue('')
            resetPredictions()
        }

        if ( typeof value === 'boolean' ){
            setIsOpen(value)
            return
        }

        setIsOpen( prev => !prev)
    }

    useEffect(()=>{
        if(selectedAddress) {

            const firstLoadAddress = selectedAddress?.street_address ?? selectedAddress?.city ?? selectedAddress?.country 

            setInputValue( firstLoadAddress )

        }
        
        return ()=>{
            if (debounceTimeoutRef.current !== null) {
                window.clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [selectedAddress])

    return {
        inputValue,
        handleInputChange,
        handleSelectionAddress,
        onQuery,
        handleToogle,
        isOpen
    }
    
}