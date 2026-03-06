import { useEffect, useRef, useState } from 'react'
import { useMobile } from '@/app/contexts/MobileContext'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { Order } from '@/features/order/types/order'
import { useOrderSelectionStore } from '@/features/order/store/orderSelection.store'
import { buildBatchSelectionPayload } from '@/features/order/store/orderSelectionHooks.store'
import type { RouteSolutionStop } from '@/features/plan/planTypes/localDelivery/types/routeSolutionStop'
import { useMessageHandler } from '@/shared/message-handler'

import { derivePlanDndIntent } from '@/features/plan/domain/planDndIntent'
import { useExecutePlanDndIntent } from '@/features/plan/controllers/useExecutePlanDndIntent'

const MAX_BATCH_IDS = 200

export type ActiveDrag =
  | { type: 'order'; order: Order }
  | { type: 'order_batch'; order: Order; selectedCount: number; isLoading: boolean }
  | { type: 'order_group'; order: Order; count: number; label: string }
  | {
      type: 'route_stop'
      order: Order
      stop: RouteSolutionStop
      routeStopClientId: string
      planStartDate?: string | null
    }
  | {
      type: 'route_stop_group'
      order: Order
      stop: RouteSolutionStop
      count: number
      label: string
      firstStopOrder?: number | null
      lastStopOrder?: number | null
      planStartDate?: string | null
    }
  | null

export const usePlanOrderDndController = () => {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const [droppedInPlan, setDroppedInPlan] = useState<string | null>(null)
  const dropFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isMobile } = useMobile()
  const { showMessage } = useMessageHandler()
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

  const isOrderSelectedForBatch = (
    order: Order | null | undefined,
    state: ReturnType<typeof useOrderSelectionStore.getState>,
  ) => {
    if (!order) return false
    if (typeof order.id === 'number') {
      if (state.excludedServerIds.includes(order.id)) {
        return false
      }
      return state.manualSelectedServerIds.includes(order.id)
        || state.loadedSelectionIds.includes(order.id)
    }
    return state.manualSelectedClientIds.includes(order.client_id)
  }

  const hasSelectionIntent = (state: ReturnType<typeof useOrderSelectionStore.getState>) =>
    state.manualSelectedServerIds.some((id) => !state.excludedServerIds.includes(id))
    || state.selectAllSnapshots.length > 0

  const resolveBatchSelectedCount = (state: ReturnType<typeof useOrderSelectionStore.getState>) => {
    if (state.resolvedSelection.count > 0) {
      return state.resolvedSelection.count
    }

    const manualCount = state.manualSelectedServerIds.filter(
      (id) => !state.excludedServerIds.includes(id),
    ).length
    const estimatedSnapshots = state.selectAllSnapshots.reduce(
      (total, snapshot) => total + (snapshot.estimatedCount ?? 0),
      0,
    )
    return manualCount + estimatedSnapshots
  }

  const buildManualBatchSelection = (orderIds: number[]) => ({
    manual_order_ids: orderIds.filter((id) => Number.isFinite(id) && id > 0),
    select_all_snapshots: [],
    excluded_order_ids: [],
    source: 'group' as const,
  })

  const resolveGroupMovePosition = (
    orderedStopClientIds: string[],
    movingStopClientIds: string[],
    targetAnchorStopClientId: string | null | undefined,
  ): number | null => {
    if (!orderedStopClientIds.length || !movingStopClientIds.length || !targetAnchorStopClientId) {
      return null
    }
    if (movingStopClientIds.includes(targetAnchorStopClientId)) {
      return null
    }

    const movingSet = new Set(movingStopClientIds)
    const remaining = orderedStopClientIds.filter((clientId) => !movingSet.has(clientId))
    const targetIndex = remaining.findIndex((clientId) => clientId === targetAnchorStopClientId)
    const boundedIndex = targetIndex < 0 ? remaining.length : targetIndex
    return boundedIndex + 1
  }

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    document.body.style.cursor = 'grabbing'
    if (active.data.current?.type === 'order' && active.data.current?.order) {
      const draggedOrder = active.data.current.order as Order
      const selectionState = useOrderSelectionStore.getState()
      if (
        selectionState.isSelectionMode
        && hasSelectionIntent(selectionState)
        && isOrderSelectedForBatch(draggedOrder, selectionState)
      ) {
        setActiveDrag({
          type: 'order_batch',
          order: draggedOrder,
          selectedCount: resolveBatchSelectedCount(selectionState),
          isLoading: selectionState.resolvedSelection.isLoading,
        })
      } else {
        setActiveDrag({ type: 'order', order: draggedOrder })
      }
      return
    }
    if (active.data.current?.type === 'order_group' && active.data.current?.order) {
      setActiveDrag({
        type: 'order_group',
        order: active.data.current.order,
        count: Number(active.data.current.orderCount) || 0,
        label: String(active.data.current.label || ''),
      })
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
      return
    }
    if (active.data.current?.type === 'route_stop_group' && active.data.current?.order) {
      setActiveDrag({
        type: 'route_stop_group',
        order: active.data.current.order,
        stop: active.data.current.stop as RouteSolutionStop,
        count: Number(active.data.current.orderCount) || 0,
        label: String(active.data.current.label || ''),
        firstStopOrder: (active.data.current.firstStopOrder as number | null | undefined) ?? null,
        lastStopOrder: (active.data.current.lastStopOrder as number | null | undefined) ?? null,
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

    let intent = null
    const selectionState = useOrderSelectionStore.getState()
    const activeOrder = (activeData?.order as Order | undefined) ?? null
    const selectionModeEnabled = selectionState.isSelectionMode && hasSelectionIntent(selectionState)
    const isActiveOrderSelected = isOrderSelectedForBatch(activeOrder, selectionState)

    if (
      activeData?.type === 'order'
      && overData?.type === 'plan'
      && overId
      && selectionModeEnabled
    ) {
      if (!isActiveOrderSelected) {
        showMessage({
          status: 'warning',
          message: 'Drag a selected order when selection mode is active.',
        })
        resetDragUi()
        return
      }

      intent = {
        kind: 'ASSIGN_ORDERS_TO_PLAN_BATCH' as const,
        planClientId: overId,
        selection: buildBatchSelectionPayload(selectionState),
      }
    } else if (
      activeData?.type === 'order_group'
      && overData?.type === 'plan'
      && overId
    ) {
      const manualIds = Array.isArray(activeData.orderIds)
        ? activeData.orderIds.filter((id: unknown): id is number => Number.isFinite(Number(id)) && Number(id) > 0)
          .map((id: number) => Number(id))
        : []
      if (!manualIds.length) {
        resetDragUi()
        return
      }
      if (manualIds.length > MAX_BATCH_IDS) {
        const confirmed = window.confirm('This action will move more than 200 orders. Continue?')
        if (!confirmed) {
          resetDragUi()
          return
        }
      }

      intent = {
        kind: 'ASSIGN_ORDERS_TO_PLAN_BATCH' as const,
        planClientId: overId,
        selection: buildManualBatchSelection(manualIds),
      }
    } else if (
      activeData?.type === 'route_stop_group'
      && overData?.type === 'plan'
      && overId
    ) {
      const manualIds = Array.isArray(activeData.orderIds)
        ? activeData.orderIds.filter((id: unknown): id is number => Number.isFinite(Number(id)) && Number(id) > 0)
          .map((id: number) => Number(id))
        : []
      if (!manualIds.length) {
        resetDragUi()
        return
      }
      if (manualIds.length > MAX_BATCH_IDS) {
        const confirmed = window.confirm('This action will move more than 200 orders. Continue?')
        if (!confirmed) {
          resetDragUi()
          return
        }
      }

      intent = {
        kind: 'ASSIGN_ORDERS_TO_PLAN_BATCH' as const,
        planClientId: overId,
        selection: buildManualBatchSelection(manualIds),
      }
    } else if (
      activeData?.type === 'route_stop_group'
      && (overData?.type === 'route_stop' || overData?.type === 'route_stop_group_drop')
    ) {
      const routeSolutionId = Number(activeData.routeSolutionId)
      const routeStopIds = Array.isArray(activeData.routeStopIds)
        ? activeData.routeStopIds
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
        : []
      const targetAnchorStopId = overData?.type === 'route_stop'
        ? Number(overData.stop?.id)
        : Number(overData?.anchorStopId)
      const orderedStopClientIds = Array.isArray(activeData.allOrderedStopClientIds)
        ? activeData.allOrderedStopClientIds.map((clientId: unknown) => String(clientId))
        : []
      const movingStopClientIds = Array.isArray(activeData.routeStopClientIds)
        ? activeData.routeStopClientIds.map((clientId: unknown) => String(clientId))
        : []
      const targetAnchorStopClientId = overData?.type === 'route_stop'
        ? String(overData.stop?.client_id ?? '')
        : String(overData?.anchorStopClientId ?? '')
      const position = resolveGroupMovePosition(
        orderedStopClientIds,
        movingStopClientIds,
        targetAnchorStopClientId,
      )
      if (
        !Number.isFinite(routeSolutionId)
        || !Number.isFinite(targetAnchorStopId)
        || !routeStopIds.length
        || !position
      ) {
        resetDragUi()
        return
      }

      intent = {
        kind: 'MOVE_ROUTE_STOP_GROUP' as const,
        routeSolutionId,
        routeStopIds,
        position,
        anchorStopId: targetAnchorStopId,
      }
    } else {
      intent = derivePlanDndIntent({
        activeType: activeData?.type as string | undefined,
        overType: overData?.type as string | undefined,
        activeId,
        overId,
        activeOrderClientId,
      })
    }

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
