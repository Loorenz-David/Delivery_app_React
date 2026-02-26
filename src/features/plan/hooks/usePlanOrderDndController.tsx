import { useEffect, useRef, useState } from 'react'
import { useMobile } from '@/app/contexts/MobileContext'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { Order } from '@/features/order/types/order'
import type { RouteSolutionStop } from '@/features/plan/planTypes/localDelivery/types/routeSolutionStop'

import { derivePlanDndIntent } from '@/features/plan/domain/planDndIntent'
import { useExecutePlanDndIntent } from '@/features/plan/controllers/useExecutePlanDndIntent'

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

export const usePlanOrderDndController = () => {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const [droppedInPlan, setDroppedInPlan] = useState<string | null>(null)
  const dropFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isMobile } = useMobile()
  const { execute } = useExecutePlanDndIntent()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile ? { distance: 10 } : { distance: 6 },
    }),
  )

  const setDroppedInPlanFeedback = (planClientId: string) => {
    if (dropFeedbackTimeoutRef.current) {
      clearTimeout(dropFeedbackTimeoutRef.current)
    }
    setDroppedInPlan(planClientId)
    dropFeedbackTimeoutRef.current = setTimeout(() => {
      setDroppedInPlan(null)
      dropFeedbackTimeoutRef.current = null
    }, 350)
  }

  useEffect(() => {
    return () => {
      if (dropFeedbackTimeoutRef.current) {
        clearTimeout(dropFeedbackTimeoutRef.current)
      }
      document.body.style.cursor = ''
    }
  }, [])

  const resetDragUi = () => {
    document.body.style.cursor = ''
    setActiveDrag(null)
  }

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    document.body.style.cursor = 'grabbing'
    if (active.data.current?.type === 'order' && active.data.current?.order) {
      setActiveDrag({ type: 'order', order: active.data.current.order })
      return
    }
    if (active.data.current?.type === 'route_stop' && active.data.current?.order) {
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
    resetDragUi()
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      resetDragUi()
      return
    }

    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData) {
      resetDragUi()
      return
    }

    const activeId = active.id ? String(active.id) : undefined
    const overId = overData?.id ? String(overData.id) : undefined
    const activeOrderClientId =
      activeData.type === 'order'
        ? (typeof activeData.id === 'string' ? activeData.id : activeId)
        : activeData.type === 'route_stop'
          ? (activeData.order?.client_id as string | undefined)
          : undefined

    const intent = derivePlanDndIntent({
      activeType: activeData?.type as string | undefined,
      overType: overData?.type as string | undefined,
      activeId,
      overId,
      activeOrderClientId,
    })

    const result = await execute(intent)
    if (result?.droppedPlanClientId) {
      setDroppedInPlanFeedback(result.droppedPlanClientId)
    }

    resetDragUi()
  }

  return {
    onDragOver,
    onDragEnd,
    onDragStart,
    onDragCancel,
    sensors,
    droppedInPlan,
    activeDrag,
  }
}
