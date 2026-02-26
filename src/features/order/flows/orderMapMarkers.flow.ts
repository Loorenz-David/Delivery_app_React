import { useEffect } from 'react'

import { MAP_MARKER_LAYERS, type MapOrder } from '@/shared/map'
import { useMapManager } from '@/shared/resource-manager/useResourceManager'

import type { Order } from '../types/order'

type BuildOrderMarkersParams = {
  orders: Order[]
  markerClassName: string
  onMarkerClick: (event: MouseEvent, order: Order) => void
  onMarkerMouseEnter?: (event: MouseEvent, order: Order) => void
  onMarkerMouseLeave?: (event: MouseEvent, order: Order) => void
}

type UseOrderMapMarkersFlowParams = BuildOrderMarkersParams & {
  visible: boolean
}

const UNSCHEDULED_COLOR = '#8b8b8b'
const GOLDEN_ANGLE = 137.508
const planColorCache = new Map<number, string>()

const getPlanColor = (planId: number): string => {
  if (planColorCache.has(planId)) {
    return planColorCache.get(planId)!
  }

  const hue = (planId * GOLDEN_ANGLE) % 360
  const color = `hsl(${hue}, 75%, 48%)`
  planColorCache.set(planId, color)
  return color
}

const getOrderMarkerColor = (order: Order): string => {
  if (!order.delivery_plan_id) return UNSCHEDULED_COLOR
  return getPlanColor(order.delivery_plan_id)
}

const hasValidCoordinates = (order: Order) => {
  const coordinates = order.client_address?.coordinates
  return (
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lng)
  )
}

export const buildOrderMarkers = ({
  orders,
  markerClassName,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}: BuildOrderMarkersParams): MapOrder[] =>
  orders
    .filter(hasValidCoordinates)
    .map((order) => ({
      id: order.client_id,
      coordinates: {
        lat: order.client_address!.coordinates.lat,
        lng: order.client_address!.coordinates.lng,
      },
      markerColor: getOrderMarkerColor(order),
      delivery_plan_id: order.delivery_plan_id ?? null,
      className: markerClassName,
      interactionVariant: 'order',
      onClick: (event: MouseEvent) => onMarkerClick(event, order),
      onMouseEnter: onMarkerMouseEnter
        ? (event: MouseEvent) => onMarkerMouseEnter(event, order)
        : undefined,
      onMouseLeave: onMarkerMouseLeave
        ? (event: MouseEvent) => onMarkerMouseLeave(event, order)
        : undefined,
    }))

export const useOrderMapMarkersFlow = ({
  orders,
  markerClassName,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
  visible,
}: UseOrderMapMarkersFlowParams) => {
  const mapManager = useMapManager()

  useEffect(() => {
    const markers = buildOrderMarkers({
      orders,
      markerClassName,
      onMarkerClick,
      onMarkerMouseEnter,
      onMarkerMouseLeave,
    })
  

    mapManager.setMarkerLayer(MAP_MARKER_LAYERS.orders, markers)
    mapManager.setMarkerLayerVisibility(MAP_MARKER_LAYERS.orders, visible)

    if (visible) {
      mapManager.showRoute(null)
      mapManager.reframeToVisibleArea()
    }
  }, [mapManager, markerClassName, onMarkerClick, onMarkerMouseEnter, onMarkerMouseLeave, orders, visible])
}
