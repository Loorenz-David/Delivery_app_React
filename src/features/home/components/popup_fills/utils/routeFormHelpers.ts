import type { AddressPayload, RoutePayload } from '../../../types/backend'
import type { RouteCreatePayload } from '../../../api/deliveryService'

export type RouteFormState = RouteCreatePayload & {
  id?: number
}

export const ROUTE_MUTABLE_FIELDS: Array<keyof RouteCreatePayload> = [
  'route_label',
  'delivery_date',
  'arrival_time_range',
  'driver_id',
  'start_location',
  'end_location',
  'set_start_time',
  'set_end_time',
  'state_id',
]

export const createInitialFormState = (deliveryDate?: string): RouteFormState => ({
  route_label: '',
  delivery_date: deliveryDate ? formatDateForInput(deliveryDate) : '',
  arrival_time_range: 30,
  driver_id: null,
  start_location: null,
  end_location: null,
  set_start_time: '',
  set_end_time: '',
  state_id: 1,
})

export function normalizeAddressPayload(location?: AddressPayload | null): AddressPayload {
  return {
    raw_address: location?.raw_address ?? '',
    city: location?.city ?? null,
    country: location?.country ?? null,
    postalCode: location?.postalCode ?? location?.postal_code ?? null,
    postal_code: location?.postal_code ?? null,
    coordinates: location?.coordinates,
  }
}

export function formatDateForInput(value?: string | null): string {
  if (!value) {
    return ''
  }
  return value.split('T')[0] ?? value
}

export function normalizeTimeValue(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const timeMatch = value.match(/^(\d{2}:\d{2})/)
  return timeMatch ? timeMatch[1] : value
}

export function areAddressesEqual(a?: AddressPayload | null, b?: AddressPayload | null) {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  return a.raw_address === b.raw_address
}

export function buildFormStateFromRoute(route: RoutePayload): RouteFormState {
  return {
    id: route.id,
    route_label: route.route_label,
    delivery_date: formatDateForInput(route.delivery_date),
    arrival_time_range: typeof route.arrival_time_range === 'number' ? route.arrival_time_range : 30,
    driver_id: route.driver_id ?? route.driver?.id ?? null,
    start_location: normalizeAddressPayload(route.start_location),
    end_location: normalizeAddressPayload(route.end_location),
    set_start_time: normalizeTimeValue(route.set_start_time),
    set_end_time: normalizeTimeValue(route.set_end_time),
    state_id: route.state_id ?? null,
  }
}

export function buildRoutePayloadFromFormState(formState: RouteFormState, base?: RoutePayload | null): RoutePayload {
  const startLocation = formState.start_location ?? base?.start_location ?? null
  const endLocation = formState.end_location ?? base?.end_location ?? null
  const normalizedStart = normalizeAddressPayload(startLocation)
  const normalizedEnd = normalizeAddressPayload(endLocation)
  return {
    id: formState.id ?? base?.id ?? Date.now(),
    route_label: formState.route_label,
    delivery_date: formState.delivery_date,
    arrival_time_range: formState.arrival_time_range ?? base?.arrival_time_range ?? 30,
    driver_id: formState.driver_id ?? base?.driver_id ?? null,
    driver: base?.driver ?? null,
    set_start_time: formState.set_start_time,
    set_end_time: formState.set_end_time,
    expected_start_time: base?.expected_start_time,
    expected_end_time: base?.expected_end_time,
    actual_start_time: base?.actual_start_time,
    actual_end_time: base?.actual_end_time,
    start_location: normalizedStart,
    end_location: normalizedEnd,
    using_optimization_indx: base?.using_optimization_indx,
    saved_optimizations:
      base?.saved_optimizations ?? {
        total_distance_meters: 0,
        total_duration_seconds: 0,
        expected_start_time: null,
        expected_end_time: null,
        set_start_time: formState.set_start_time,
        set_end_time: formState.set_end_time,
        start_location: normalizedStart,
        end_location: normalizedEnd,
        order_sequence: [],
        skipped_shipments: [],
        polylines: {},
        consider_traffic: false,
      },
    state_id: formState.state_id ?? base?.state_id ?? 0,
    is_optimized: base?.is_optimized ?? false,
    route_state: base?.route_state ?? { id: formState.state_id ?? base?.state_id ?? 0, name: base?.route_state?.name ?? '' },
    delivery_orders: base?.delivery_orders ?? [],
    team: base?.team,
  }
}
