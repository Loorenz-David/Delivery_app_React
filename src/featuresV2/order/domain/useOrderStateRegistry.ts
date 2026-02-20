import { useMemo } from 'react'

import { useOrderStates } from '../hooks/orderStates/useOrderStateSelectors'


import type { OrderState, OrderStates } from '../types/orderState'
import { getNextOrderStateName } from './orderStateTransition'

export const createOrderStateRegistry = (states: OrderState[]) => {
  const byId = new Map<number, OrderState>()
  const byName = new Map<OrderStates, OrderState>()

  states.forEach((state) => {
    if (typeof state.id === 'number') {
      byId.set(state.id, state)
    }
    byName.set(state.name, state)
  })

  const getById = (id: number) => byId.get(id) ?? null

  const getByName = (name: OrderStates) => byName.get(name) ?? null

  const getStateIdByName = (name: OrderStates) => {
    const state = getByName(name)
    return typeof state?.id === 'number' ? state.id : null
  }

  const getNextStateId = (currentId: number) => {
    const currentState = getById(currentId)
    if (!currentState) return null

    const nextStateName = getNextOrderStateName(currentState.name)
    if (!nextStateName) return null

    return getStateIdByName(nextStateName)
  }

  return {
    getById,
    getByName,
    getStateIdByName,
    getNextStateId,
  }
}






export const useOrderStateRegistry = () => {
  const states = useOrderStates()

  return useMemo(
    () => createOrderStateRegistry(states),
    [states],
  )
}
