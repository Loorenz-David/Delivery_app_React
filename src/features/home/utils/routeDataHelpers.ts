import type { OrderPayload, RoutePayload, SavedOptimizations, OptimizationOrderSequence } from '../types/backend'

type OrderSequenceEntry = {
  delivery_arrangement?: number | null
  expected_arrival_time?: string | null
}

export function mergeRouteWithOptimizedData(route: RoutePayload, optimizedRoute: RoutePayload) {
  const sourceOrders = optimizedRoute.delivery_orders?.length ? optimizedRoute.delivery_orders : route.delivery_orders ?? []
  const mergedOrders = mergeOrders(route.delivery_orders ?? [], sourceOrders)
  const nextSavedOptimizations = mergeSavedOptimizations(route.saved_optimizations, optimizedRoute.saved_optimizations)
  const latestOptimization = normalizeSavedOptimizations(nextSavedOptimizations).at(-1) ?? null
  let ordersWithSequence = applyOrderSequenceToOrders(mergedOrders, latestOptimization?.order_sequence)
  if (!latestOptimization?.order_sequence && optimizedRoute.delivery_orders?.length) {
    const orderIndex: Record<number, number> = {}
    optimizedRoute.delivery_orders.forEach((order, index) => {
      orderIndex[order.id] = index
    })
    ordersWithSequence = mergedOrders
      .slice()
      .sort((a, b) => (orderIndex[a.id] ?? Number.MAX_SAFE_INTEGER) - (orderIndex[b.id] ?? Number.MAX_SAFE_INTEGER))
  }
  return {
    ...route,
    ...optimizedRoute,
    delivery_orders: ordersWithSequence,
    saved_optimizations: nextSavedOptimizations ?? optimizedRoute.saved_optimizations ?? route.saved_optimizations,
  }
}

export function mergeOrders(existing: OrderPayload[], incoming: OrderPayload[]) {
  const incomingById = new Map(incoming.map((order) => [order.id, order]))
  return existing.map((order) => {
    const candidate = incomingById.get(order.id)
    if (!candidate) {
      return order
    }
    return {
      ...order,
      ...candidate,
    }
  })
}

export function mergeSavedOptimizations(
  existing: RoutePayload['saved_optimizations'],
  incoming: RoutePayload['saved_optimizations'],
): RoutePayload['saved_optimizations'] {
  if (!incoming) {
    return existing
  }
  if (Array.isArray(incoming)) {
    return incoming
  }
  if (!existing) {
    return incoming
  }
  if (Array.isArray(existing)) {
    return [...existing, incoming].slice(-3)
  }
  return [existing, incoming].slice(-3)
}

export function applyOrderSequenceToOrders(orders: OrderPayload[], orderSequence: OptimizationOrderSequence | null | undefined) {
  if (!orderSequence || !orders.length) {
    return orders
  }
  const sequenceMap: Record<number, OrderSequenceEntry> = {}
  if (Array.isArray(orderSequence)) {
    orderSequence.forEach((entry, index) => {
      const target = orders[index]
      if (target) {
        if (typeof entry === 'number') {
          sequenceMap[target.id] = { delivery_arrangement: entry }
        } else {
          sequenceMap[target.id] = entry ?? {}
        }
      }
    })
  } else {
    Object.entries(orderSequence).forEach(([key, value]) => {
      const parsed = Number(key)
      if (!Number.isNaN(parsed)) {
        sequenceMap[parsed] = value ?? {}
      }
    })
  }

  let maxArrangement = -1
  const updatedOrders = orders.map((order) => {
    const sequenceEntry = sequenceMap[order.id]
    if (!sequenceEntry) {
      return order
    }
    const nextArrangement =
      typeof sequenceEntry.delivery_arrangement === 'number'
        ? sequenceEntry.delivery_arrangement
        : order.delivery_arrangement
    if (typeof nextArrangement === 'number') {
      maxArrangement = Math.max(maxArrangement, nextArrangement)
    }
    return {
      ...order,
      delivery_arrangement: nextArrangement ?? order.delivery_arrangement ?? 0,
      expected_arrival_time:
        sequenceEntry.expected_arrival_time !== undefined
          ? sequenceEntry.expected_arrival_time
          : order.expected_arrival_time ?? null,
    }
  })

  let nextArrangement = maxArrangement >= 0 ? maxArrangement + 1 : 0
  const filledOrders = updatedOrders.map((order) => {
    if (sequenceMap[order.id]) {
      return order
    }
    return {
      ...order,
      delivery_arrangement: nextArrangement++,
      expected_arrival_time: null,
    }
  })

  return filledOrders.slice().sort((a, b) => {
    const aArrangement = typeof a.delivery_arrangement === 'number' ? a.delivery_arrangement : Number.MAX_SAFE_INTEGER
    const bArrangement = typeof b.delivery_arrangement === 'number' ? b.delivery_arrangement : Number.MAX_SAFE_INTEGER
    return aArrangement - bArrangement
  })
}

export function normalizeSavedOptimizations(saved: RoutePayload['saved_optimizations']): SavedOptimizations[] {
  if (!saved) {
    return []
  }
  return Array.isArray(saved) ? saved : [saved]
}
