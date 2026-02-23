export type PlanDndIntent =
  | { kind: 'MOVE_ROUTE_STOP'; fromStopClientId: string; toStopClientId: string }
  | { kind: 'ASSIGN_ORDER_TO_PLAN'; orderClientId: string; planClientId: string }
  | null

export function derivePlanDndIntent(params: {
  activeType?: string
  overType?: string
  activeId?: string
  overId?: string
  activeOrderClientId?: string
}): PlanDndIntent {
  const { activeType, overType, activeId, overId, activeOrderClientId } = params

  if (
    activeType === 'route_stop'
    && overType === 'route_stop'
    && activeId
    && overId
  ) {
    return {
      kind: 'MOVE_ROUTE_STOP',
      fromStopClientId: activeId,
      toStopClientId: overId,
    }
  }

  if (
    (activeType === 'order' || activeType === 'route_stop')
    && overType === 'plan'
    && activeOrderClientId
    && overId
  ) {
    return {
      kind: 'ASSIGN_ORDER_TO_PLAN',
      orderClientId: activeOrderClientId,
      planClientId: overId,
    }
  }

  return null
}
