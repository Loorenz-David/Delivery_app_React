import type { PlaceSuggestion } from '../types'
import { useAddressAutocompleteContext } from './AddressAutocomplete.context'

type PropsSuggestionCard = {
    suggestion: PlaceSuggestion 

}


export const SuggestionCard = ({
    suggestion,
    
}: PropsSuggestionCard)=>{

    const { handleSelectionAddress, handleToogle } = useAddressAutocompleteContext()

    const onSelect = ()=>{  

        
        requestAnimationFrame(()=>{
            (document.activeElement as HTMLElement | null)?.blur()
        })
        handleSelectionAddress( suggestion )
        handleToogle({ value: false });
    }
    return(
        <li key={suggestion.placeId}>
            <div
               
                className="flex w-full flex-col gap-0.5 px-3 py-3 text-left text-sm hover:bg-[var(--color-page)]"
                onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect()
                }}

            >
            <span className="font-medium text-[var(--color-text)]">{suggestion.mainText ?? suggestion.description}</span>
            {suggestion.secondaryText && (
                <span className="text-xs text-[var(--color-muted)]">{suggestion.secondaryText}</span>
            )}
            </div>
      </li>
    )
}


export const SuggestionsSelector = () => {
    const { isLoading, suggestions } = useAddressAutocompleteContext()


    if ( !isLoading && suggestions.length ){
        return ( 
            <ul>
                
                { suggestions.map(( suggestion, i ) => (
                    <SuggestionCard
                        key={ 'suggestion_' + i }
                        suggestion={suggestion}
                    />
                )) } 
    
            </ul>
        );

    }else if( isLoading ){
        return(
            <div>
                is Loading
            </div>
        )
    }

    return (
        <div>
            No matches. Try refining your search.
        </div>
    )
}
