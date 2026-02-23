import { useEffect } from 'react'

import type { Order } from '@/featuresV2/order/types/order'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import { MAP_MARKER_LAYERS, type MapOrder } from '@/shared/map'
import { useMapManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import type { BoundaryLocationMeta } from '@/featuresV2/plan/planTypes/localDelivery/domain/getLocalDeliveryBoundaryLocations'

type LocalDeliveryMapParams = {
  orders: Order[]
  stopByOrderId: Map<number, RouteSolutionStop>
  selectedRouteSolution: RouteSolution | null
  boundaryLocations: {
    start: BoundaryLocationMeta
    end: BoundaryLocationMeta
  }
}


export const useLocalDeliveryMapFlow = ({
  orders,
  stopByOrderId,
  selectedRouteSolution,
  boundaryLocations, 
}: LocalDeliveryMapParams) => {
  const mapManager = useMapManager()
  const sectionManager = useSectionManager()

  const handleClickMarker = (element:MouseEvent, order:Order) =>{
    element
    
    sectionManager.open({
        key:"order.details",
        payload:{mode:"edit", clientId:order.client_id, parentParams:{borderLeft:'rgb(var(--color-light-blue-r),0.7)'}}
    })
  }
  useEffect(() => {
    const mapOrders: MapOrder[] = []
    const solutionClientId = selectedRouteSolution?.client_id ?? 'unknown'
    
    const startMarker = buildStartEndMarker({
      label: 'S',
      status: 'start',
      boundary: boundaryLocations.start,
      idPrefix: `route-start-${solutionClientId}`,
      onClick: (e: MouseEvent) => handleClickStartEndMarker(e, 'start'),
    })
    if (startMarker) {
      mapOrders.push(startMarker)
    }

    const endMarker = buildStartEndMarker({
      label: 'E',
      status: 'end',
      idPrefix: `route-end-${solutionClientId}`,
      boundary: boundaryLocations.end,
      onClick: (e: MouseEvent) => handleClickStartEndMarker(e, 'end'),
    })
    if (endMarker) {
      mapOrders.push(endMarker)
    }

    const orderMarkers = orders
      .map((order) => {
        const coordinates = order.client_address?.coordinates
        if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
          return null
        }
        const orderId = order.client_id
        const stop = order.id != null ? stopByOrderId.get(order.id) : undefined
        return {
          id: orderId,
          onClick: (e: MouseEvent) => handleClickMarker(e, order),
          coordinates,
          ...(stop?.stop_order != null && { label: String(stop.stop_order) }),
          // status: order.order_state_id != null ? String(order.order_state_id) : undefined,
        }
      })
      .filter((order): order is MapOrder => order !== null)

    mapOrders.push(...orderMarkers)

    mapManager.setMarkerLayer(MAP_MARKER_LAYERS.localDelivery, mapOrders)
    mapManager.setMarkerLayerVisibility(MAP_MARKER_LAYERS.localDelivery, true)
   
    if(selectedRouteSolution && selectedRouteSolution.route_polyline ){
      mapManager.showRoute( {path: selectedRouteSolution.route_polyline} )
    } else {
      mapManager.showRoute(null)
    }

  }, [boundaryLocations, mapManager, orders, selectedRouteSolution, stopByOrderId])

  useEffect(() => {
    return () => {
      mapManager.clearMarkerLayer(MAP_MARKER_LAYERS.localDelivery)
      mapManager.showRoute(null)
    }
  }, [mapManager])
}



const handleClickStartEndMarker = (_element: MouseEvent, _marker: string) => {
  // Marker clicks for start/end are intentionally no-op for now.
}

const buildStartEndMarker = ({
  label,
  status,
  idPrefix,
  boundary,
  onClick,
}: {
  label: 'S' | 'E'
  status: 'start' | 'end'
  idPrefix: string
  boundary: BoundaryLocationMeta
  onClick: (e: MouseEvent) => void
}): MapOrder | null => {
  if (!boundary.location?.coordinates) return null

  const coordinates = boundary.location.coordinates
  if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') return null

  return {
    id: idPrefix,
    coordinates,
    label,
    status,
    onClick,
  }
}
