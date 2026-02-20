import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useRef } from 'react'

import {  useVisibleOrders } from '../store/orderStore'
import { OrderContextProvider } from './OrderContext'
import { useOrderFlow } from '../hooks/useOrderFlow'
import { useOrderActions } from '../hooks/useOrderActions'
import {   useOrderQuery } from "../store/orderQueryStore";

export const OrderProvider = ({ children }: PropsWithChildren) => {
  const orders = useVisibleOrders()
  const orderActions = useOrderActions()
  const query = useOrderQuery()
  const fistLoad = useRef(true)

  const { loadOrders } = useOrderFlow()

  useEffect(() => {
    if (fistLoad.current) {
      loadOrders(query, true)
      fistLoad.current = false
    } else {
      loadOrders(query, false)
    }
  }, [query])



  const value = useMemo(
    () => ({
      orders,
      orderActions,
      query,
    }),
    [orders, orderActions],
  )

  return <OrderContextProvider value={value}>{children}</OrderContextProvider>
}
