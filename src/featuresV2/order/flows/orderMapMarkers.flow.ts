import { useEffect } from 'react'

import { MAP_MARKER_LAYERS, type MapOrder } from '@/shared/map'
import { useMapManager } from '@/shared/resource-manager/useResourceManager'

import type { Order } from '../types/order'

type BuildOrderMarkersParams = {
  orders: Order[]
  markerClassName: string
  onMarkerClick: (event: MouseEvent, order: Order) => void
}

type UseOrderMapMarkersFlowParams = BuildOrderMarkersParams & {
  visible: boolean
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
}: BuildOrderMarkersParams): MapOrder[] =>
  orders
    .filter(hasValidCoordinates)
    .map((order) => ({
      id: order.client_id,
      coordinates: {
        lat: order.client_address!.coordinates.lat,
        lng: order.client_address!.coordinates.lng,
      },
      className: markerClassName,
      interactionVariant: 'order',
      onClick: (event: MouseEvent) => onMarkerClick(event, order),
    }))

export const useOrderMapMarkersFlow = ({
  orders,
  markerClassName,
  onMarkerClick,
  visible,
}: UseOrderMapMarkersFlowParams) => {
  const mapManager = useMapManager()

  useEffect(() => {
    const markers = buildOrderMarkers({
      orders,
      markerClassName,
      onMarkerClick,
    })

    mapManager.setMarkerLayer(MAP_MARKER_LAYERS.orders, markers)
    mapManager.setMarkerLayerVisibility(MAP_MARKER_LAYERS.orders, visible)

    if (visible) {
      mapManager.showRoute(null)
    }
  }, [mapManager, markerClassName, onMarkerClick, orders, visible])
}
