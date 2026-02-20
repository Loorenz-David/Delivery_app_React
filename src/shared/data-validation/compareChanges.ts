
import isEqual from 'lodash/isEqual'
import type { RefObject } from 'react'

export const hasFormChanges = <T,>(
    form:T, 
    ref: RefObject<T | null>
)=>{
    if ( !ref.current ) return true

    return !isEqual( form, ref.current )
}

export const areObjectsEqual = <T,>(first: T, second: T) => {
    return isEqual(first, second)
}
