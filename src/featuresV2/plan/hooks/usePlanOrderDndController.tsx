import { useState } from 'react'
import { useMobile } from '@/app/contexts/MobileContext'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import { useOrderMutations } from '@/featuresV2/order/hooks/useOrderMutations'
import { useRouteSolutionStopMutations } from '@/featuresV2/plan/planTypes/localDelivery/hooks/routeSolutionStops/useRouteSolutionStopMutations'
import type { Order } from '@/featuresV2/order/types/order'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'

import { selectPlanByClientId, usePlanStore } from '../store/plan.slice'
import type { DeliveryPlan } from '../types/plan'





export type ActiveDrag =
  | { type: 'order'; order: Order }
  | {
      type: 'route_stop'
      order: Order
      stop: RouteSolutionStop
      routeStopClientId: string
      planStartDate?: string | null
    }
  | null



export const usePlanOrderDndControllers = ()=>{
  const [ activeDrag, setActiveDrag ] = useState< ActiveDrag >(null)
  const { updateOrderDeliveryPlan } = useOrderMutations()
  const { updateRouteStopPositionOptimistic } = useRouteSolutionStopMutations()
  const [ droppedInPlan, setDroppedInPlan ] = useState<string | null>(null)
  const { isMobile } = useMobile()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile 
      ?{distance:10}
      : {distance:6}
    })
  )

  const setDroppedInPlanFeedback = (planClientId: string) => {
    setDroppedInPlan(planClientId)
    setTimeout(() => {
      setDroppedInPlan(null)
    }, 350)
  }

  const onDragStart = (event: DragStartEvent) =>{
    const { active } = event
    document.body.style.cursor = 'grabbing'
    if(active.data.current?.type == 'order' && active.data.current?.order){
      setActiveDrag({ type: 'order', order: active.data.current.order })
      return
    }
    if(active.data.current?.type == 'route_stop' && active.data.current?.order){
      setActiveDrag({
        type: 'route_stop',
        order: active.data.current.order,
        stop: active.data.current.stop as RouteSolutionStop,
        routeStopClientId: active.id.toString(),
        planStartDate: active.data.current.planStartDate as string | null | undefined,
      })
    }
  }

  const onDragOver = () => {
    // Reserved for live hover side-effects in the future.
  }

  const onDragCancel = () => {
    document.body.style.cursor = ''
    setActiveDrag(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      document.body.style.cursor = ''
      setActiveDrag(null)
      return
    }
    
    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData || !overData?.id) {
      document.body.style.cursor = ''
      setActiveDrag(null)
      return
    }

    let deliveryPlan: DeliveryPlan | null = null
    if(overData.type == 'plan'){
      deliveryPlan = selectPlanByClientId(overData.id)(usePlanStore.getState())
    }

    if (activeData.type === 'route_stop') {

      if (overData.type === 'route_stop') {
        if (activeData.id) {
          void updateRouteStopPositionOptimistic(activeData.id, overData.id)
        }
      }
      if (overData.type === 'plan') {
        const routeStopOrderClientId = activeData.order?.client_id
        if (routeStopOrderClientId && deliveryPlan?.id) {
          void updateOrderDeliveryPlan(routeStopOrderClientId, deliveryPlan.id)
          setDroppedInPlanFeedback(overData.id)
        }
      }
      document.body.style.cursor = ''
      setActiveDrag(null)
      return
    }

    if (activeData.type === 'order' && overData.type === 'plan' && activeData.id && deliveryPlan?.id) {
      void updateOrderDeliveryPlan(
        activeData.id,
        deliveryPlan.id
      )
      setDroppedInPlanFeedback(overData.id)
    }

    setActiveDrag(null)
    document.body.style.cursor = ''

  }

  

  return {
    onDragOver,
    onDragEnd,
    onDragStart,
    onDragCancel,
    sensors,
    droppedInPlan,
    activeDrag
  }
}
