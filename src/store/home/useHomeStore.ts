import { create } from 'zustand'

import type { RouteDependencies, RouteStateOption, DriverOption, ItemStateOption, ItemStatePosition, ItemCategoryOption } from '../../features/home/api/optionServices'
import type { OrderPayload, RoutePayload } from '../../features/home/types/backend'

type SelectionMeta = {
  routeId?: number | null
}

type HomeState = {
  routes: RoutePayload[]
  routeStates: RouteStateOption[]
  drivers: DriverOption[]
  itemStates: ItemStateOption[]
  itemPositions: ItemStatePosition[]
  itemOptions: ItemCategoryOption[]
  defaultWarehouses: RouteDependencies['default_warehouses']
  routeStatesMap: Record<number, RouteStateOption>
  driversMap: Record<number, DriverOption>
  itemStatesMap: Record<number, ItemStateOption>
  itemPositionsMap: Record<number, ItemStatePosition>
  selectedRouteId: number | null
  selectedRouteMeta: SelectionMeta | null
  selectedOrderId: number | null
  selectedOrderMeta: SelectionMeta | null
  // helpers
  findRouteById: (routeId: number | null | undefined) => RoutePayload | null
  findOrderById: (orderId: number | null | undefined, routeId?: number | null) => OrderPayload | null
  mapRouteStates: () => Record<number, RouteStateOption>
  mapDrivers: () => Record<number, DriverOption>
  mapItemStates: () => Record<number, ItemStateOption>
  mapItemPositions: () => Record<number, ItemStatePosition>
  setDependencies: (deps: RouteDependencies) => void
  setItemOptions: (options: ItemCategoryOption[]) => void
  setRoutes: (routes: RoutePayload[]) => void
  upsertRoute: (route: RoutePayload) => void
  removeRoute: (routeId: number) => void
  updateRoute: (routeId: number, updater: (route: RoutePayload) => RoutePayload) => void
  selectRoute: (routeId: number | null, meta?: SelectionMeta, data?: RoutePayload | null) => void
  selectOrder: (orderId: number | null, meta?: SelectionMeta) => void
  clearSelections: () => void
  updateOrderInRoute: (routeId: number, orderId: number, updater: (order: OrderPayload) => OrderPayload) => void
  replaceOrderInRoute: (routeId: number, order: OrderPayload) => void
  appendOrderToRoute: (routeId: number, order: OrderPayload) => void
  removeOrderFromRoute: (routeId: number, orderId: number) => void
  optimisticUpdateRoutes: (updater: (routes: RoutePayload[]) => RoutePayload[]) => () => void
  optimisticUpdateRoute: (routeId: number, updater: (route: RoutePayload) => RoutePayload) => () => void
}

const buildMap = <T extends { id: number }>(items: T[]): Record<number, T> => {
  return items.reduce<Record<number, T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}

export const useHomeStore = create<HomeState>((set, get) => ({
  routes: [],
  routeStates: [],
  drivers: [],
  itemStates: [],
  itemPositions: [],
  itemOptions: [],
  defaultWarehouses: [],
  routeStatesMap: {},
  driversMap: {},
  itemStatesMap: {},
  itemPositionsMap: {},
  selectedRouteId: null,
  selectedRouteMeta: null,
  selectedOrderId: null,
  selectedOrderMeta: null,
  findRouteById: (routeId) => {
    if (routeId == null) return null
    return get().routes.find((route) => route.id === routeId) ?? null
  },
  findOrderById: (orderId, routeId) => {
    if (orderId == null) return null
    const targetRoute = routeId != null ? get().routes.find((route) => route.id === routeId) : undefined
    const searchRoutes = targetRoute ? [targetRoute] : get().routes
    for (const route of searchRoutes) {
      const found = route.delivery_orders?.find((order) => order.id === orderId)
      if (found) return found
    }
    return null
  },
  mapRouteStates: () => buildMap(get().routeStates),
  mapDrivers: () => buildMap(get().drivers),
  mapItemStates: () => buildMap(get().itemStates),
  mapItemPositions: () => buildMap(get().itemPositions),

  setDependencies: (deps) =>
    set(() => ({
      routeStates: deps.route_states ?? [],
      drivers: deps.drivers ?? [],
      itemStates: deps.item_states ?? [],
      itemPositions: deps.item_positions ?? [],
      itemOptions: deps.item_options ?? [],
      defaultWarehouses: deps.default_warehouses ?? [],
      routeStatesMap: deps.route_states_map ?? buildMap(deps.route_states ?? []),
      driversMap: deps.drivers_map ?? buildMap(deps.drivers ?? []),
      itemStatesMap: deps.item_states_map ?? buildMap(deps.item_states ?? []),
      itemPositionsMap: deps.item_positions_map ?? buildMap(deps.item_positions ?? []),
    })),

  setItemOptions: (options) =>
    set(() => ({
      itemOptions: options ?? [],
    })),

  setRoutes: (routes) =>
    set(() => ({
      routes: routes ?? [],
    })),

  upsertRoute: (route) =>
    set((state) => {
      const exists = state.routes.some((entry) => entry.id === route.id)
      const routes = exists ? state.routes.map((entry) => (entry.id === route.id ? route : entry)) : [...state.routes, route]
      return { routes }
    }),

  removeRoute: (routeId) =>
    set((state) => ({
      routes: state.routes.filter((route) => route.id !== routeId),
    })),

  updateRoute: (routeId, updater) =>
    set((state) => {
      let updated: RoutePayload | null = null
      const routes = state.routes.map((route) => {
        if (route.id !== routeId) return route
        updated = updater(route)

        return updated
      })
      return updated ? { routes } : {}
    }),

  selectRoute: (routeId, meta, data) =>
    set(() => ({
      selectedRouteId: routeId,
      selectedRouteMeta: meta ?? null,
      selectedOrderId: data?.delivery_orders?.length ? data.delivery_orders[0]?.id ?? null : null,
      selectedOrderMeta: data?.delivery_orders?.length
        ? { routeId: routeId ?? null }
        : null,
    })),

  selectOrder: (orderId, meta) =>
    set(() => ({
      selectedOrderId: orderId,
      selectedOrderMeta: meta ?? null,
    })),

  clearSelections: () =>
    set(() => ({
      selectedRouteId: null,
      selectedRouteMeta: null,
      selectedOrderId: null,
      selectedOrderMeta: null,
    })),

  updateOrderInRoute: (routeId, orderId, updater) =>
    set((state) => {
      const routes = state.routes.map((route) => {
        if (route.id !== routeId) return route
        let updatedOrder: OrderPayload | null = null
        const existingOrders: OrderPayload[] = route.delivery_orders ?? []
        const delivery_orders = existingOrders.map((order) => {
          if (order.id !== orderId) return order
          updatedOrder = updater(order)
          return updatedOrder
        })
        if (!updatedOrder) {
          return route
        }
        const finalizedOrder = updatedOrder as OrderPayload
        const previousLen = existingOrders.find((o) => o.id === orderId)?.delivery_items?.length ?? 0
        const total_items =
          route.total_items != null
            ? route.total_items - previousLen + (finalizedOrder.delivery_items?.length ?? 0)
            : delivery_orders.reduce((sum, entry) => sum + (entry.delivery_items?.length ?? 0), 0)
        const total_orders = route.total_orders ?? delivery_orders.length
        return { ...route, delivery_orders, total_items, total_orders }
      })
      return { routes }
    }),

  replaceOrderInRoute: (routeId, order) =>
    set((state) => {
      const routes = state.routes.map((route) => {
        if (route.id !== routeId) return route
        const previous = (route.delivery_orders ?? []).find((entry) => entry.id === order.id)
        const delivery_orders = (route.delivery_orders ?? []).map((entry) => (entry.id === order.id ? order : entry))
        const total_items =
          route.total_items != null && previous
            ? route.total_items - (previous.delivery_items?.length ?? 0) + (order.delivery_items?.length ?? 0)
            : delivery_orders.reduce((sum, entry) => sum + (entry.delivery_items?.length ?? 0), 0)
        const total_orders = route.total_orders ?? delivery_orders.length
        return { ...route, delivery_orders, total_items, total_orders }
      })
      return { routes }
    }),

  appendOrderToRoute: (routeId, order) =>
    set((state) => {
      const routes = state.routes.map((route) => {
        if (route.id !== routeId) return route
        const delivery_orders = [...(route.delivery_orders ?? []), order]
        const total_items =
          route.total_items != null
            ? route.total_items + (order.delivery_items?.length ?? 0)
            : delivery_orders.reduce((sum, entry) => sum + (entry.delivery_items?.length ?? 0), 0)
        const total_orders = route.total_orders != null ? route.total_orders + 1 : delivery_orders.length
        return { ...route, delivery_orders, total_items, total_orders }
      })
      return { routes }
    }),

  removeOrderFromRoute: (routeId, orderId) =>
    set((state) => {
      const routes = state.routes.map((route) => {
        if (route.id !== routeId) return route
        const previous = (route.delivery_orders ?? []).find((order) => order.id === orderId)
        const delivery_orders = (route.delivery_orders ?? []).filter((order) => order.id !== orderId)
        const total_items =
          route.total_items != null && previous
            ? Math.max(0, route.total_items - (previous.delivery_items?.length ?? 0))
            : delivery_orders.reduce((sum, entry) => sum + (entry.delivery_items?.length ?? 0), 0)
        const total_orders = route.total_orders != null ? Math.max(0, route.total_orders - 1) : delivery_orders.length
        return { ...route, delivery_orders, total_items, total_orders }
      })
      return { routes }
    }),

  optimisticUpdateRoutes: (updater) => {
    let previous: RoutePayload[] | null = null
    set((state) => {
      previous = state.routes
      return { routes: updater(state.routes) }
    })
    return () => {
      if (previous) {
        set({ routes: previous })
      }
    }
  },

  optimisticUpdateRoute: (routeId, updater) => {
    let previous: RoutePayload[] | null = null
    set((state) => {
      previous = state.routes
      const routes = state.routes.map((route) => (route.id === routeId ? updater(route) : route))
      return { routes }
    })
    return () => {
      if (previous) {
        set({ routes: previous })
      }
    }
  },
}))

export const homeStore = useHomeStore
