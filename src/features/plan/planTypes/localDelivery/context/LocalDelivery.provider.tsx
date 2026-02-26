import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useOrdersByPlanId } from '@/features/order/store/orderHooks.store'
import { usePlanByServerId } from '@/features/plan/store/usePlan.selector'
import { useLocalDeliveryPlanByPlanId } from '@/features/plan/planTypes/localDelivery/store/useLocalDeliveryPlan.selector'
import { useSelectedRouteSolutionByLocalDeliveryPlanId } from '@/features/plan/planTypes/localDelivery/store/useRouteSolution.selector'
import { useLocalDeliveryHeaderAction } from '@/features/plan/planTypes/localDelivery/actions/useLocalDeliveryHeaderAction'
import { useLocalDeliveryOverviewFlow } from '@/features/plan/planTypes/localDelivery/flows/localDeliveryOverview.flow'
import {
  selectRouteSolutionStopsBySolutionId,
  useRouteSolutionStopStore,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import type { RouteSolutionStop } from '@/features/plan/planTypes/localDelivery/types/routeSolutionStop'
import type { Order } from '@/features/order/types/order'

import { useLocalDeliveryMapFlow } from '../flows/localDeliveryMap.flow'
import { useLocalDeliveryCircleSelectionFlow } from '../flows/localDeliveryCircleSelection.flow'
import { getLocalDeliveryBoundaryLocations } from '../domain/getLocalDeliveryBoundaryLocations'

import { LocalDeliveryContext } from './LocalDelivery.context'
import { usePlanStateRegistryFlow } from '@/features/plan/flows/planStateRegistry.flow'
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
  const baseControlls = useBaseControlls<{ ordersPlanType: string | null; planId?: number | null }>()
  const isLocalDeliveryActive =
    baseControlls.isBaseOpen && baseControlls.payload?.ordersPlanType === 'local_delivery'

  const { fetchLocalDeliveryOverview } = useLocalDeliveryOverviewFlow()
  const plan = usePlanByServerId(planId)
  const localDeliveryPlan = useLocalDeliveryPlanByPlanId(planId)
  const orders = useOrdersByPlanId(planId)
  const localDeliveryPlanId = localDeliveryPlan?.id ?? null
  const selectedRouteSolution = useSelectedRouteSolutionByLocalDeliveryPlanId(localDeliveryPlanId)
  const routeSolutionId = selectedRouteSolution?.id ?? null
  const routeSolutionStops = useRouteSolutionStopStore(
    useShallow(selectRouteSolutionStopsBySolutionId(routeSolutionId)),
  )

  const planStateRegistry = usePlanStateRegistryFlow()
  const planState = planStateRegistry.getById(plan?.state_id ?? null)
  
  const localDeliveryActions = useLocalDeliveryHeaderAction({
    localDeliveryPlanId,
    planId: plan?.id ?? planId,
  })

  const planStartDate = plan?.start_date ?? null

  const {stopByOrderId, ordersById} = stopOrdersMapperById( {routeSolutionStops, orders} )

  const boundaryLocations = useMemo(
    () => getLocalDeliveryBoundaryLocations(
      stopByOrderId,
      ordersById,
      selectedRouteSolution ?? null,
    ),
    [ordersById, selectedRouteSolution, stopByOrderId],
  )

  useLocalDeliveryMapFlow({
    orders,
    stopByOrderId,
    selectedRouteSolution,
    isActive: isLocalDeliveryActive,
    boundaryLocations,
  })
  useLocalDeliveryCircleSelectionFlow(isLocalDeliveryActive)

  useEffect(() => {
    if (planId == null) return
    fetchLocalDeliveryOverview(planId)
  }, [fetchLocalDeliveryOverview, planId])

  const handleKeyDown = (event:KeyboardEvent)=>{
    if(event.key == 'Escape') {
      if(isPopupOpen || areSectionsOpen ) return
      baseControlls.closeBase()
    }
   
  }

  useEffect(()=>{

    if(!isMobile){
      window.addEventListener('keydown', handleKeyDown)
    }

      return () => {

          window.removeEventListener('keydown', handleKeyDown)
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
