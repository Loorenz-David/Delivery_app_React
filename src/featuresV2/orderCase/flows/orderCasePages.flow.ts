import { useEffect, useRef } from 'react'

import { useOrderCaseByClientId,   useOrderCasesByOrderId, useVisibleOrderCases } from '../store/orderCaseStore'
import { useOrderCaseFlow } from './orderCase.flow'
import { useDetailsControllers } from '../controllers/details.controllers'

import { useOrderCaseQuery } from '../store/orderCaseQueryStore'

export const useOrderCaseMainFlow = ( ) => {
  const { loadAllCases } = useOrderCaseFlow()
  const firstPageLoad = useRef(true)
  const cases = useVisibleOrderCases()
  const query = useOrderCaseQuery()

   useEffect(()=>{
        if(!firstPageLoad.current){
            loadAllCases(query, firstPageLoad.current)
            firstPageLoad.current = false
            return
        }
        loadAllCases(query)
  },[query])


  return {
    cases,
    query
  }
}

export const useOrderCasesByOrderFlow = (orderId: number | null) => {
  const { loadCasesByOrder } = useOrderCaseFlow()
  const cases = useOrderCasesByOrderId(orderId)

  useEffect(() => {
    if (orderId == null) return

    void loadCasesByOrder(orderId)
  }, [ orderId])

  return {
    cases,
  }
}

export const useOrderCaseDetailsFlow = (orderCaseClientId: string ) => {
  const { loadCaseDetails } = useOrderCaseFlow()
  const { markCaseChatsAsRead } = useDetailsControllers()

  const orderCase = useOrderCaseByClientId(orderCaseClientId)
  const orderCaseId = orderCase?.id

  useEffect(() => {
    if (orderCase == null || !orderCaseId ) return
    
    void loadCaseDetails(orderCaseId)
  }, [orderCaseId])

  useEffect(() => {
    if (!orderCase || !orderCaseId || orderCase.unseen_chats <= 0) return
    void markCaseChatsAsRead(orderCaseId)
  }, [orderCase])

  return {
    orderCase,
  }
}
