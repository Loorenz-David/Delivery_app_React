import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {  useVisibleOrders } from '../store/orderHooks.store'
import { OrderContextProvider } from './OrderContext'
import { useOrderFlow } from '../flows/order.flow'
import { useOrderActions } from '../actions/order.actions'
import {   useOrderQuery } from "../store/orderQuery.store";
import { useOrderMapMarkersFlow } from '../flows/orderMapMarkers.flow'
import { useBaseControlls } from '@/shared/resource-manager/useResourceManager'
import { useOrderCircleSelectionFlow } from '../flows/orderCircleSelection.flow'

export const OrderProvider = ({ children }: PropsWithChildren) => {
  const orders = useVisibleOrders()
  const orderActions = useOrderActions()
  const baseControlls = useBaseControlls()
  const query = useOrderQuery()
  const fistLoad = useRef(true)

  const { loadOrders } = useOrderFlow()
  

  useOrderMapMarkersFlow({
    orders,
    onMarkerClick: orderActions.handleOrderMarkerClick,
    markerClassName: 'order-marker',
    visible: !baseControlls.isBaseOpen,
  })
  useOrderCircleSelectionFlow()

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
