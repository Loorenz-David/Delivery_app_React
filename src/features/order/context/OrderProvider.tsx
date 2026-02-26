import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {  useVisibleOrders } from '../store/orderHooks.store'
import { OrderContextProvider } from './OrderContext'
import { useOrderFlow } from '../flows/order.flow'
import { useOrderActions } from '../actions/order.actions'
import {   useOrderQuery } from "../store/orderQuery.store";
import { useOrderMapMarkersFlow } from '../flows/orderMapMarkers.flow'
import { useBaseControlls, useMapManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import { useOrderCircleSelectionFlow } from '../flows/orderCircleSelection.flow'
import { useOrderStats } from '../store/orderList.store'
import { useHoveredOrderClientId, useOrderMapInteractionActions } from '../store/orderMapInteractionHooks.store'
import { useStackActionEntries } from '@/shared/stack-manager/useStackActionEntries'
import type { Order } from '../types/order'

export const OrderProvider = ({ children }: PropsWithChildren) => {
  const orders = useVisibleOrders()
  const orderStats = useOrderStats()
  const orderActions = useOrderActions()
  const baseControlls = useBaseControlls()
  const query = useOrderQuery()
  const fistLoad = useRef(true)
  const mapManager = useMapManager()
  const sectionManager = useSectionManager()
  const sectionEntries = useStackActionEntries(sectionManager)
  const hoveredClientId = useHoveredOrderClientId()
  const { setHovered, clearHovered } = useOrderMapInteractionActions()

  const { loadOrders } = useOrderFlow()

  const activeOrderDetailClientId = useMemo(() => {
    const openOrderDetails = sectionEntries.filter(
      (entry) => !entry.isClosing && entry.key === 'order.details',
    )
    const latest = openOrderDetails.at(-1)
    const payload = latest?.payload as { clientId?: string } | undefined
    return payload?.clientId ?? null
  }, [sectionEntries])

  const handleOrderRowMouseEnter = useCallback(
    (order: Order) => {
      setHovered(order.client_id, 'list')
    },
    [setHovered],
  )

  const handleOrderRowMouseLeave = useCallback(() => {
    clearHovered('list')
  }, [clearHovered])

  const handleOrderMarkerMouseEnter = useCallback(
    (_event: MouseEvent, order: Order) => {
      setHovered(order.client_id, 'map')
    },
    [setHovered],
  )

  const handleOrderMarkerMouseLeave = useCallback((_event: MouseEvent, _order: Order) => {
    clearHovered('map')
  }, [clearHovered])
  

  useOrderMapMarkersFlow({
    orders,
    onMarkerClick: orderActions.handleOrderMarkerClick,
    onMarkerMouseEnter: handleOrderMarkerMouseEnter,
    onMarkerMouseLeave: handleOrderMarkerMouseLeave,
    markerClassName: 'order-marker',
    visible: !baseControlls.isBaseOpen,
  })
  useOrderCircleSelectionFlow()

  useEffect(() => {
    mapManager.setSelectedMarker(activeOrderDetailClientId)
  }, [activeOrderDetailClientId, mapManager])

  useEffect(() => {
    mapManager.setHoveredMarker(hoveredClientId)
  }, [hoveredClientId, mapManager])

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
      orderStats,
      hoveredClientId,
      handleOrderRowMouseEnter,
      handleOrderRowMouseLeave,
    }),
    [handleOrderRowMouseEnter, handleOrderRowMouseLeave, hoveredClientId, orderActions, orderStats, orders, query],
  )

  return <OrderContextProvider value={value}>{children}</OrderContextProvider>
}
