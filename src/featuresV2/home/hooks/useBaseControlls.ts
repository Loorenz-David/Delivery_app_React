import { useState } from 'react'
import type{ PayloadBase } from '../types/types'

export const useBaseControlls = <T>()=>{

    const [ isBaseOpen, setIsBaseOpen ] = useState(false)
    const [ payload, setPayload ] = useState<T | null>(null)


    const openBase =  ({payload}:{payload:T})=>{
        setIsBaseOpen(true)
        setPayload(payload)
    }
    const closeBase = ()=>{
        setIsBaseOpen(false)
        setPayload(null)
    }
    

    return {
        isBaseOpen,
        payload,
        openBase,
        closeBase,
        setBasePayload: setPayload
    }


}




export const usePayloadBaseControlls = () =>
  useBaseControlls<PayloadBase>()