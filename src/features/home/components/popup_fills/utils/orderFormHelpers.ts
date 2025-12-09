import type { AddressPayload, ItemPayload, OrderPayload, RoutePayload, RoutesPack } from '../../../types/backend'
import type { PhoneValue } from '../../../../../components/forms/PhoneField'
import type { DataManager } from '../../../../../resources_manager/managers/DataManager'
import type { OrderItemCreatePayload } from '../../../api/deliveryService'
import type { ItemStateOption, ItemStatePosition } from '../../../api/optionServices'

import { DEFAULT_PREFIX } from '../../../../../constants/dropDownOptions'

export type ItemAction = 'create' | 'update' | 'delete'

export interface DraftItemDimensions {
  width: string
  height: string
  depth: string
}

export interface DraftItem {
  front_end_id: number
  id?: number
  article_number: string
  item_category: string | { id: number; name: string }
  item_type: string | { id: number; name: string }
  item_valuation: number | null
  page_link: string
  dimensions: DraftItemDimensions
  weight: number | null
  properties: Record<string, string>
  item_state_id: number | null
  item_position_id: number | null
  action?: ItemAction
}

export interface OrderFormState {
  client_language: string
  first_name: string
  last_name: string
  client_email: string
  client_address: AddressPayload | null
  primary_phone: PhoneValue
  secondary_phone: PhoneValue
  delivery_after: string
  delivery_before: string
  termsAccepted: boolean
  delivery_items: DraftItem[]
}

export const DEFAULT_LANGUAGE = 'en'

export const languageOptions = [
  { value: 'en', display: 'English' },
  { value: 'es', display: 'Spanish' },
  { value: 'se', display: 'Swedish' },
  { value: 'fr', display: 'French' },
]

export const createEmptyItem = (): DraftItem => ({
  front_end_id: 0,
  article_number: '',
  item_category: '',
  item_type: '',
  item_valuation: null,
  page_link: '',
  dimensions: {
    width: '',
    height: '',
    depth: '',
  },
  weight: null,
  properties: {},
  item_state_id: null,
  item_position_id: null,
})

export const createEmptyOrderState = (): OrderFormState => ({
  client_language: DEFAULT_LANGUAGE,
  first_name: '',
  last_name: '',
  client_email: '',
  client_address: null,
  primary_phone: { prefix: DEFAULT_PREFIX, number: '' },
  secondary_phone: { prefix: DEFAULT_PREFIX, number: '' },
  delivery_after: '',
  delivery_before: '',
  termsAccepted: false,
  delivery_items: [],
})

export function normalizeDraftLabelValue(value: DraftItem['item_category']): string {
  if (!value) {
    return ''
  }
  return typeof value === 'string' ? value : value.name ?? ''
}

export function normalizeDimensionValue(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (!value || !value.toString().trim()) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildOrderItemCreatePayload(item: DraftItem, options?: { clientReference?: number }): OrderItemCreatePayload {
  const payload: OrderItemCreatePayload = {
    article_number: item.article_number.trim(),
    item_category: normalizeDraftLabelValue(item.item_category).trim(),
    item_type: normalizeDraftLabelValue(item.item_type).trim(),
    item_state_id: item.item_state_id ?? undefined,
    item_position_id: item.item_position_id ?? undefined,
    item_valuation: item.item_valuation ?? undefined,
    page_link: item.page_link || undefined,
    weight: item.weight ?? undefined,
    properties: Object.keys(item.properties ?? {}).length ? item.properties : undefined,
    dimensions: {
      length_cm: normalizeDimensionValue(item.dimensions.depth),
      width_cm: normalizeDimensionValue(item.dimensions.width),
      height_cm: normalizeDimensionValue(item.dimensions.height),
    },
  }
  if (options?.clientReference != null) {
    payload.client_reference = options.clientReference
  }
  return pruneNullish(payload) as OrderItemCreatePayload
}

export function convertItemPropertiesToStrings(properties?: Record<string, string | number | boolean>) {
  if (!properties) {
    return {}
  }
  return Object.entries(properties).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value == null ? '' : String(value)
    return acc
  }, {})
}

export function formatDimensionInput(value?: number | null): string {
  if (value == null) {
    return ''
  }
  return String(value)
}

function pruneNullish<T extends Record<string, any>>(value: T): Partial<T> {
  return Object.entries(value).reduce<Partial<T>>((acc, [key, val]) => {
    if (val === null || val === undefined) {
      return acc
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
      const nested = pruneNullish(val as Record<string, any>)
      if (Object.keys(nested).length === 0) {
        return acc
      }
      acc[key as keyof T] = nested as any
      return acc
    }
    acc[key as keyof T] = val as any
    return acc
  }, {})
}

export function buildDraftItemCard(item: DraftItem) {
  return {
    id: item.front_end_id,
    article_number: item.article_number,
    item_type: item.item_type,
    item_state_id: item.item_state_id ?? undefined,
    item_position_id: item.item_position_id ?? undefined,
    weight: typeof item.weight === 'number' ? item.weight : 0,
    dimensions: {
      length_cm: Number(item.dimensions.depth) || 0,
      width_cm: Number(item.dimensions.width) || 0,
      height_cm: Number(item.dimensions.height) || 0,
    },
    properties: item.properties,
  }
}

export function computeNextDeliveryArrangement(route?: RoutePayload | null): number {
  if (!route || !Array.isArray(route.delivery_orders) || route.delivery_orders.length === 0) {
    return 0
  }
  const maxArrangement = route.delivery_orders.reduce((max, order) => {
    const value = typeof order.delivery_arrangement === 'number' ? order.delivery_arrangement : -1
    return value > max ? value : max
  }, -1)
  return maxArrangement + 1
}

export function getItemIdentifier(item: DraftItem): number {
  return item.front_end_id ?? item.id ?? 0
}

export function convertDraftItemToPayload(item: DraftItem, orderId: number, fallbackId: number): ItemPayload {
  const finalId = item.id ?? fallbackId
  const weight = typeof item.weight === 'number' && Number.isFinite(item.weight) ? item.weight : 0
  const length_cm = normalizeDimensionValue(item.dimensions.depth) ?? 0
  const width_cm = normalizeDimensionValue(item.dimensions.width) ?? 0
  const height_cm = normalizeDimensionValue(item.dimensions.height) ?? 0
  return {
    id: finalId,
    article_number: item.article_number,
    item_type: item.item_type,
    item_category: item.item_category,
    item_state_id: item.item_state_id ?? 0,
    item_position_id: item.item_position_id ?? 0,
    order_id: orderId,
    properties: item.properties,
    weight,
    dimensions: {
      length_cm,
      width_cm,
      height_cm,
    },
    item_state_record: [],
    item_position_record: [],
  }
}

interface BuildOrderPayloadOptions {
  routeId: number
  fallbackOrderId?: number
  deliveryArrangement: number
}

export function buildOrderPayloadFromState(state: OrderFormState, options: BuildOrderPayloadOptions): OrderPayload {
  const fallbackOrderId = options.fallbackOrderId ?? Date.now()
  const filteredItems = state.delivery_items.filter((item) => item.action !== 'delete')
  const items = filteredItems.map((item, index) =>
    convertDraftItemToPayload(item, fallbackOrderId, getItemIdentifier(item) || index + 1),
  )

  return {
    id: fallbackOrderId,
    client_first_name: state.first_name.trim(),
    client_last_name: state.last_name.trim(),
    client_email: state.client_email.trim(),
    client_primary_phone: {
      prefix: state.primary_phone.prefix,
      number: state.primary_phone.number.trim(),
    },
    client_secondary_phone: state.secondary_phone,
    client_address: state.client_address as AddressPayload,
    client_language: state.client_language,
    notes_chat: [],
    expected_arrival_time: '',
    actual_arrival_time: null,
    marketing_messages: false,
    delivery_after: state.delivery_after || undefined,
    delivery_before: state.delivery_before || undefined,
    stop_time: undefined,
    in_range: undefined,
    delivery_arrangement: options.deliveryArrangement,
    route_id: options.routeId,
    delivery_items: items,
  }
}

export function mergeOrderWithResponse(
  fallback: OrderPayload,
  responseOrder?: Partial<OrderPayload> | null,
): OrderPayload {
  if (!responseOrder) {
    return fallback
  }

  const { delivery_items: responseItems, ...rest } = responseOrder
  const merged: OrderPayload = {
    ...fallback,
    ...rest,
  }

  if (Array.isArray(responseItems) && responseItems.length) {
    merged.delivery_items = fallback.delivery_items.map((item, index) => {
      const responseItem = responseItems[index]
      if (!responseItem) {
        return item
      }
      return {
        ...item,
        ...responseItem,
        order_id: rest.id ?? item.order_id,
      }
    })
  }

  if (rest.id != null) {
    merged.delivery_items = merged.delivery_items.map((item) => ({
      ...item,
      order_id: rest.id ?? item.order_id,
    }))
  }

  return merged
}

export function convertOrderPayloadToFormState(order: OrderPayload): OrderFormState {
  const draftItems: DraftItem[] = (order.delivery_items ?? []).map((item, index) => ({
    front_end_id: item.id ?? index + 1,
    id: item.id,
    article_number: item.article_number ?? '',
    item_category: item.item_category ?? '',
    item_type: item.item_type ?? '',
    item_valuation: item.item_valuation ?? null,
    page_link: item.page_link ?? '',
    dimensions: {
      width: formatDimensionInput(item.dimensions?.width_cm),
      height: formatDimensionInput(item.dimensions?.height_cm),
      depth: formatDimensionInput(item.dimensions?.length_cm),
    },
    weight: item.weight ?? null,
    properties: convertItemPropertiesToStrings(item.properties),
    item_state_id: item.item_state_id ?? null,
    item_position_id: item.item_position_id ?? null,
  }))

  return {
    client_language: order.client_language ?? DEFAULT_LANGUAGE,
    first_name: order.client_first_name ?? '',
    last_name: order.client_last_name ?? '',
    client_email: order.client_email ?? '',
    client_address: order.client_address ?? null,
    primary_phone: order.client_primary_phone ?? { prefix: DEFAULT_PREFIX, number: '' },
    secondary_phone: order.client_secondary_phone ?? { prefix: DEFAULT_PREFIX, number: '' },
    delivery_after: order.delivery_after ?? '',
    delivery_before: order.delivery_before ?? '',
    termsAccepted: true,
    delivery_items: draftItems,
  }
}

export function calculateNextItemSequence(items: DraftItem[]): number {
  if (!items.length) {
    return 1
  }
  const maxValue = Math.max(...items.map((item) => getItemIdentifier(item) || 0))
  return maxValue + 1
}

export interface OrderSnapshot {
  client_first_name: string
  client_last_name: string
  client_email: string
  client_primary_phone: PhoneValue
  client_secondary_phone: PhoneValue | null
  client_address: AddressPayload | null
  client_language: string
  delivery_after: string
  delivery_before: string
}

export interface ItemSnapshot {
  article_number: string
  item_category: string
  item_type: string
  item_state_id: number | null
  item_position_id: number | null
  item_valuation: number | null
  page_link?: string
  weight: number | null
  properties: Record<string, string>
  dimensions: {
    length_cm: number | null
    width_cm: number | null
    height_cm: number | null
  }
}

type ItemMutationPayload =
  | { action: 'create'; fields: OrderItemCreatePayload }
  | { action: 'update'; id: number; fields: Partial<Record<string, unknown>> }
  | { action: 'delete'; id: number }

export interface CreatedItemResponse {
  id: number
  client_reference?: number
}

export function buildOrderSnapshot(state: OrderFormState): OrderSnapshot {
  return {
    client_first_name: state.first_name.trim(),
    client_last_name: state.last_name.trim(),
    client_email: state.client_email.trim(),
    client_primary_phone: {
      prefix: state.primary_phone.prefix,
      number: state.primary_phone.number,
    },
    client_secondary_phone: state.secondary_phone.number ? state.secondary_phone : null,
    client_address: state.client_address,
    client_language: state.client_language,
    delivery_after: state.delivery_after,
    delivery_before: state.delivery_before,
  }
}

export function buildInitialItemSnapshotMap(items: ItemPayload[] = []): Record<number, ItemSnapshot> {
  return items.reduce<Record<number, ItemSnapshot>>((acc, item) => {
    if (item.id != null) {
      acc[item.id] = buildItemSnapshotFromPayload(item)
    }
    return acc
  }, {})
}

export function buildItemSnapshotFromPayload(item: ItemPayload): ItemSnapshot {
  const resolveLabel = (value: string | { id: number; name: string } | undefined): string => {
    if (!value) {
      return ''
    }
    return typeof value === 'string' ? value : value.name ?? ''
  }

  return {
    article_number: item.article_number ?? '',
    item_category: resolveLabel(item.item_category),
    item_type: resolveLabel(item.item_type),
    item_state_id: item.item_state_id ?? null,
    item_position_id: item.item_position_id ?? null,
    item_valuation: (item as any).item_valuation ?? null,
    page_link: (item as any).page_link ?? '',
    weight: item.weight ?? null,
    properties: convertItemPropertiesToStrings(item.properties as Record<string, string | number | boolean>),
    dimensions: {
      length_cm: item.dimensions?.length_cm ?? null,
      width_cm: item.dimensions?.width_cm ?? null,
      height_cm: item.dimensions?.height_cm ?? null,
    },
  }
}

export function buildItemSnapshotFromDraft(item: DraftItem): ItemSnapshot {
  const resolveLabel = (value: DraftItem['item_category'] | DraftItem['item_type']): string => {
    if (!value) {
      return ''
    }
    return typeof value === 'string' ? value : value.name ?? ''
  }

  return {
    article_number: item.article_number.trim(),
    item_category: resolveLabel(item.item_category).trim(),
    item_type: resolveLabel(item.item_type).trim(),
    item_state_id: item.item_state_id ?? null,
    item_position_id: item.item_position_id ?? null,
    item_valuation: item.item_valuation ?? null,
    page_link: item.page_link || '',
    weight: item.weight ?? null,
    properties: { ...item.properties },
    dimensions: {
      length_cm: normalizeDimensionValue(item.dimensions.depth),
      width_cm: normalizeDimensionValue(item.dimensions.width),
      height_cm: normalizeDimensionValue(item.dimensions.height),
    },
  }
}

export function buildItemMutations(items: DraftItem[], initialItems: Record<number, ItemSnapshot>): ItemMutationPayload[] {
  const mutations: ItemMutationPayload[] = []
  items.forEach((item) => {
    if (item.action === 'delete' && item.id) {
      mutations.push({ action: 'delete', id: item.id })
      return
    }
    if (item.action === 'create') {
      const fields = buildOrderItemCreatePayload(item, { clientReference: getItemIdentifier(item) })
      mutations.push({ action: 'create', fields })
      return
    }
    if (item.action === 'update' && item.id) {
      const currentSnapshot = buildItemSnapshotFromDraft(item)
      const previousSnapshot = initialItems[item.id]
      const fieldDiff = diffItemSnapshots(previousSnapshot, currentSnapshot)
      if (Object.keys(fieldDiff).length > 0) {
        mutations.push({ action: 'update', id: item.id, fields: fieldDiff })
      }
    }
  })
  return mutations
}

export function buildOrderUpdateFields(
  initialSnapshot: OrderSnapshot | null,
  state: OrderFormState,
  initialItems: Record<number, ItemSnapshot>,
): Record<string, unknown> | null {
  const currentSnapshot = buildOrderSnapshot(state)
  const changedFields = diffOrderSnapshots(initialSnapshot, currentSnapshot)
  const itemMutations = buildItemMutations(state.delivery_items, initialItems)

  if (!Object.keys(changedFields).length && !itemMutations.length) {
    return null
  }
  const payload: Record<string, unknown> = { ...changedFields }
  if (itemMutations.length) {
    payload.delivery_items = itemMutations
  }
  return payload
}

export function diffItemSnapshots(base: ItemSnapshot | undefined, current: ItemSnapshot): Record<string, unknown> {
  if (!base) {
    return current as unknown as Record<string, unknown>
  }
  const changed: Record<string, unknown> = {}
  const keys = Object.keys(current) as Array<keyof ItemSnapshot>
  for (const key of keys) {
    const prev = base[key]
    const next = current[key]
    if (!areValuesEqual(prev, next)) {
      changed[key] = next
    }
  }
  return changed
}

export function diffOrderSnapshots(base: OrderSnapshot | null, current: OrderSnapshot): Record<string, unknown> {
  if (!base) {
    return {
      client_first_name: current.client_first_name,
      client_last_name: current.client_last_name,
      client_email: current.client_email,
      client_primary_phone: current.client_primary_phone,
      client_secondary_phone: current.client_secondary_phone,
      client_address: current.client_address,
      client_language: current.client_language,
      delivery_after: current.delivery_after,
      delivery_before: current.delivery_before,
    }
  }
  const changed: Record<string, unknown> = {}
  const entries = Object.entries(current) as Array<[keyof OrderSnapshot, unknown]>
  entries.forEach(([key, value]) => {
    const previousValue = base[key]
    if (!areValuesEqual(previousValue, value)) {
      const fieldName = key as keyof OrderSnapshot
      changed[fieldName] = value
    }
  })
  return changed
}

export function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }
  if (a == null || b == null) {
    return a === b
  }
  return JSON.stringify(a) === JSON.stringify(b)
}

export function appendOrderToRoute(manager: DataManager<RoutesPack>, routeId: number, order: OrderPayload): void {
  manager.updateDataset((dataset) => {
    if (!dataset) {
      return dataset
    }
    const nextRoutes = dataset.routes.map((route) => {
      if (route.id !== routeId) {
        return route
      }
      const nextOrders = [...(route.delivery_orders ?? []), order]
      return {
        ...route,
        delivery_orders: nextOrders,
        total_orders: route.total_orders != null ? route.total_orders + 1 : nextOrders.length,
        total_items: route.total_items != null ? route.total_items + order.delivery_items.length : route.total_items,
      }
    })
    return {
      ...dataset,
      routes: nextRoutes,
    }
  })

  const activeSelection = manager.getActiveSelection<RoutePayload>('SelectedRoute')
  const baseRoute = activeSelection?.data
  if (activeSelection?.id === routeId && baseRoute) {
    const nextOrders = [...(baseRoute.delivery_orders ?? []).filter((entry: OrderPayload) => entry.id !== order.id), order]
    manager.setActiveSelection('SelectedRoute', {
      id: routeId,
      data: {
        ...baseRoute,
        delivery_orders: nextOrders,
      },
    })
  }
}

export function replaceOrderInRoute(manager: DataManager<RoutesPack>, routeId?: number | null, order?: OrderPayload | null): void {
  if (!order) {
    return
  }
  const targetRouteId = routeId ?? order.route_id ?? null
  if (targetRouteId == null) {
    return
  }
  manager.updateDataset((dataset) => {
    if (!dataset) {
      return dataset
    }
    const nextRoutes = dataset.routes.map((route) => {
      if (route.id !== targetRouteId) {
        return route
      }
      const nextOrders = (route.delivery_orders ?? []).map((entry: OrderPayload) => (entry.id === order.id ? order : entry))

      return {
        ...route,
        delivery_orders: nextOrders,
      }
    })
    return {
      ...dataset,
      routes: nextRoutes,
    }
  })

  const activeSelection = manager.getActiveSelection<RoutePayload>('SelectedRoute')
  if (activeSelection?.id === targetRouteId) {
    const nextOrders = (activeSelection.data?.delivery_orders ?? []).map((entry: OrderPayload) =>
      entry.id === order.id ? order : entry,
    )
    manager.setActiveSelection('SelectedRoute', {
      id: targetRouteId,
      data: {
        ...(activeSelection.data ?? {}),
        delivery_orders: nextOrders,
      },
    })
  }

  const activeOrder = manager.getActiveSelection<OrderPayload>('SelectedOrder')
  if (activeOrder?.id === order.id) {
    manager.setActiveSelection('SelectedOrder', {
      id: order.id,
      data: order,
      meta: {
        ...(activeOrder.meta ?? {}),
        routeId: targetRouteId,
      },
    })
  }
}

export function removeOrderFromRoute(manager: DataManager<RoutesPack>, routeId: number, orderId: number): void {
  manager.updateDataset((dataset) => {
    if (!dataset) {
      return dataset
    }
    const nextRoutes = dataset.routes.map((route) => {
      if (route.id !== routeId) {
        return route
      }
      const filteredOrders = (route.delivery_orders ?? []).filter((entry) => entry.id !== orderId)
      return {
        ...route,
        delivery_orders: filteredOrders,
        total_orders: route.total_orders != null ? Math.max(0, route.total_orders - 1) : filteredOrders.length,
      }
    })
    return {
      ...dataset,
      routes: nextRoutes,
    }
  })

  const activeRoute = manager.getActiveSelection<RoutePayload>('SelectedRoute')
  if (activeRoute?.id === routeId && activeRoute.data) {
    const filteredOrders = (activeRoute.data.delivery_orders ?? []).filter((entry) => entry.id !== orderId)
    manager.setActiveSelection('SelectedRoute', {
      id: routeId,
      data: {
        ...activeRoute.data,
        delivery_orders: filteredOrders,
      },
    })
  }

  const activeOrder = manager.getActiveSelection<OrderPayload>('SelectedOrder')
  if (activeOrder?.id === orderId) {
    manager.removeActiveSelection?.('SelectedOrder')
  }
}

export function buildOrderFromExisting(baseOrder: OrderPayload | null, state: OrderFormState): OrderPayload {
  const fallbackId = baseOrder?.id ?? Date.now()
  const items = state.delivery_items
    .filter((item) => item.action !== 'delete')
    .map((item, index) => convertDraftItemToPayload(item, fallbackId, getItemIdentifier(item) || index + 1))

  return {
    ...(baseOrder ?? ({} as OrderPayload)),
    id: fallbackId,
    client_first_name: state.first_name.trim(),
    client_last_name: state.last_name.trim(),
    client_email: state.client_email.trim(),
    client_primary_phone: {
      prefix: state.primary_phone.prefix,
      number: String(state.primary_phone.number || '').trim(),
    },
    client_secondary_phone: state.secondary_phone,
    client_address: state.client_address as AddressPayload,
    client_language: state.client_language,
    delivery_after: state.delivery_after || undefined,
    delivery_before: state.delivery_before || undefined,
    delivery_items: items,
  }
}

export function applyCreatedItemIds(items: DraftItem[], createdItems: CreatedItemResponse[]): DraftItem[] {
  if (!createdItems.length) {
    return items
      .filter((item) => item.action !== 'delete')
      .map((item) => (item.action === 'update' ? { ...item, action: undefined } : item))
  }
  const referenceMap = new Map<number, number>()
  createdItems.forEach((item) => {
    if (item.client_reference != null) {
      referenceMap.set(item.client_reference, item.id)
    }
  })

  return items.reduce<DraftItem[]>((acc, item) => {
    if (item.action === 'delete') {
      return acc
    }

    if (item.action === 'create') {
      const reference = getItemIdentifier(item)
      const backendId = referenceMap.get(reference)
      acc.push({
        ...item,
        id: backendId ?? item.id,
        front_end_id: backendId ?? getItemIdentifier(item),
        action: undefined,
      })
      return acc
    }

    if (item.action === 'update') {
      acc.push({
        ...item,
        action: undefined,
      })
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

export function resolveDefaultStateIds(
  draftItem: DraftItem,
  itemStates: ItemStateOption[],
  itemPositions: ItemStatePosition[],
): DraftItem {
  const defaultState = itemStates.find((state) => state.default) ?? itemStates[0] ?? null
  const defaultPosition = itemPositions.find((position) => position.default) ?? itemPositions[0] ?? null
  let next = draftItem
  if (defaultState && draftItem.item_state_id == null) {
    next = { ...next, item_state_id: defaultState.id }
  }
  if (defaultPosition && draftItem.item_position_id == null) {
    next = { ...next, item_position_id: defaultPosition.id }
  }
  return next
}
