import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useOrdersByPlanId } from '@/featuresV2/order/hooks/useOrderSelectors'
import { usePlanByServerId } from '@/featuresV2/plan/hooks/usePlanSelectors'
import { useLocalDeliveryPlanByPlanId } from '@/featuresV2/plan/planTypes/localDelivery/hooks/useLocalDeliveryPlan'
import { useSelectedRouteSolutionByLocalDeliveryPlanId } from '@/featuresV2/plan/planTypes/localDelivery/hooks/routeSolution/useRouteSolutionSelectors'
import { useLocalDeliveryHeaderAction } from '@/featuresV2/plan/planTypes/localDelivery/hooks/useLocalDeliveryHeaderAction'
import { useLocalDeliveryOverview } from '@/featuresV2/plan/planTypes/localDelivery/hooks/overview/useLocalDeliveryOverview'
import {
  selectRouteSolutionStopsBySolutionId,
  useRouteSolutionStopStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'
import type { Order } from '@/featuresV2/order/types/order'

import { useLocalDeliveryMap } from '../hooks/useLocalDeliveryMap'
import { useLocalDeliveryBoundaryLocations } from '../hooks/useLocalDeliveryBoundaryLocations'

import { LocalDeliveryContext } from './LocalDeliveryContext'
import { usePlanStateRegistry } from '@/featuresV2/plan/hooks/planStates/usePlanStateRegistry'
import { useMobile } from '@/app/contexts/MobileContext'
import { useBaseControlls, usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

type LocalDeliveryProviderProps = {
  planId: number
  children: ReactNode
}

export function LocalDeliveryProvider({ planId, children }: LocalDeliveryProviderProps) {
  const {isMobile} = useMobile()
  const sectionManager = useSectionManager()
  const popupManager = usePopupManager()
  const isPopupOpen = popupManager.getOpenCount() > 0 
  const areSectionsOpen = sectionManager.getOpenCount()  > 0
  const baseControlls = useBaseControlls()

  const { fetchLocalDeliveryOverview } = useLocalDeliveryOverview()
  const plan = usePlanByServerId(planId)
  const localDeliveryPlan = useLocalDeliveryPlanByPlanId(planId)
  const orders = useOrdersByPlanId(planId)
  const localDeliveryPlanId = localDeliveryPlan?.id ?? null
  const selectedRouteSolution = useSelectedRouteSolutionByLocalDeliveryPlanId(localDeliveryPlanId)
  const routeSolutionId = selectedRouteSolution?.id ?? null
  const routeSolutionStops = useRouteSolutionStopStore(
    useShallow(selectRouteSolutionStopsBySolutionId(routeSolutionId)),
  )

  const planStateRegistry = usePlanStateRegistry()
  const planState = planStateRegistry.getById(plan?.state_id ?? null)
  
  const localDeliveryActions = useLocalDeliveryHeaderAction({
    localDeliveryPlanId,
    planId: plan?.id ?? planId,
  })

  const planStartDate = plan?.start_date ?? null

  const {stopByOrderId, ordersById} = stopOrdersMapperById( {routeSolutionStops, orders} )

  const boundaryLocations = useLocalDeliveryBoundaryLocations(
    stopByOrderId,
    ordersById,
    selectedRouteSolution ?? null,
  )

  useLocalDeliveryMap({ orders, stopByOrderId, selectedRouteSolution, boundaryLocations })

  useEffect(() => {
    if (planId == null) return
    fetchLocalDeliveryOverview(planId)
  }, [fetchLocalDeliveryOverview, planId])

  const hanldeKeyDown = (event:KeyboardEvent)=>{
    
    
    console.log(areSectionsOpen)
    if(event.key == 'Escape') {
      if(isPopupOpen || areSectionsOpen ) return
      baseControlls.closeBase()
    }
   
  }

  useEffect(()=>{

    if(!isMobile){
      window.addEventListener('keydown', hanldeKeyDown)
    }

      return () => {

          window.removeEventListener('keydown', hanldeKeyDown)
      }
  },[isMobile, isPopupOpen, areSectionsOpen])
  
  const contextValue = useMemo(
    () => ({
      planId,
      plan: plan ?? null,
      planState,
      localDeliveryPlan: localDeliveryPlan ?? null,
      localDeliveryPlanId,
      planStartDate,
      orders,
      stopByOrderId,
      ordersById,
      selectedRouteSolution: selectedRouteSolution ?? null,
      routeSolutionId,
      routeSolutionStops,
      boundaryLocations,
      localDeliveryActions,
    }),
    [
      planId,
      plan,
      planState,
      localDeliveryPlan,
      localDeliveryPlanId,
      planStartDate,
      orders,
      stopByOrderId,
      ordersById,
      selectedRouteSolution,
      routeSolutionId,
      routeSolutionStops,
      boundaryLocations,
      localDeliveryActions,
    ],
  )

  return <LocalDeliveryContext.Provider value={contextValue}>{children}</LocalDeliveryContext.Provider>
}


const stopOrdersMapperById = (
  {routeSolutionStops, orders }:
  {routeSolutionStops:RouteSolutionStop[], orders:Order[] }

) =>{
   const stopByOrderId = useMemo(() => {
    const stopMap = new Map<number, (typeof routeSolutionStops)[number]>()
    routeSolutionStops.forEach((stop) => {
      if (stop.order_id != null && stop.stop_order != null) {
        stopMap.set(stop.order_id, stop)
      }
    })
    return stopMap
  }, [routeSolutionStops])
  const ordersById = useMemo(() => {
    const orderMap = new Map<number, (typeof orders)[number]>()
    orders.forEach((order) => {
      if (order.id != null) {
        orderMap.set(order.id, order)
      }
    })
    return orderMap
  }, [orders])

  return {stopByOrderId, ordersById}
  
}