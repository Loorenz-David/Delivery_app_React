import type { MapOrder } from '../domain/entities/MapOrder'
import { MAP_MARKER_LAYERS } from '../domain/constants/markerLayers'
import { GoogleMapAdapter } from '../infrastructure/GoogleMapAdapter'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

class MockAdvancedMarker {
  map: unknown
  position: unknown
  content: HTMLElement
  zIndex: number

  constructor(options: { map: unknown; position: unknown; content: HTMLElement; zIndex: number }) {
    this.map = options.map
    this.position = options.position
    this.content = options.content
    this.zIndex = options.zIndex
  }
}

const createOrder = (id: string, lat = 10, lng = 20): MapOrder => ({
  id,
  coordinates: { lat, lng },
  onClick: () => undefined,
})

const createAdapter = () => {
  const adapter = new GoogleMapAdapter() as any
  adapter.map = { id: 'mock-map' }
  adapter.AdvancedMarkerCtor = MockAdvancedMarker
  return adapter as GoogleMapAdapter
}

export const runGoogleMapAdapterLayerTests = () => {
  {
    const adapter = createAdapter()
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.orders, [createOrder('order-1')])
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.localDelivery, [createOrder('plan-1')])

    const layers = (adapter as any).layers as Map<string, { markers: Map<string, unknown> }>

    assert(layers.get(MAP_MARKER_LAYERS.orders)?.markers.size === 1, 'orders layer should hold its own marker')
    assert(
      layers.get(MAP_MARKER_LAYERS.localDelivery)?.markers.size === 1,
      'localDelivery layer should hold its own marker',
    )
  }

  {
    const adapter = createAdapter()
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.orders, [createOrder('order-1')])
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.localDelivery, [createOrder('plan-1')])
    adapter.setLayerVisibility(MAP_MARKER_LAYERS.orders, false)

    const layers = (adapter as any).layers as Map<
      string,
      { markers: Map<string, { marker: { map: unknown } }> }
    >
    const orderMarker = layers.get(MAP_MARKER_LAYERS.orders)?.markers.get('order-1')
    const planMarker = layers.get(MAP_MARKER_LAYERS.localDelivery)?.markers.get('plan-1')

    assert(orderMarker?.marker.map === null, 'hidden layer marker should detach from map')
    assert(planMarker?.marker.map !== null, 'other layer marker should remain visible')
  }

  {
    const adapter = createAdapter()
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.orders, [createOrder('order-1')])
    adapter.setLayerVisibility(MAP_MARKER_LAYERS.orders, false)
    adapter.setLayerVisibility(MAP_MARKER_LAYERS.orders, true)

    const layers = (adapter as any).layers as Map<
      string,
      { markers: Map<string, { marker: { map: unknown } }> }
    >
    const orderMarker = layers.get(MAP_MARKER_LAYERS.orders)?.markers.get('order-1')

    assert(orderMarker?.marker.map !== null, 'showing layer should reattach existing marker to map')
  }

  {
    const adapter = createAdapter()
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.orders, [createOrder('order-1')])
    adapter.setLayerMarkers(MAP_MARKER_LAYERS.localDelivery, [createOrder('plan-1')])
    adapter.clearLayer(MAP_MARKER_LAYERS.localDelivery)

    const layers = (adapter as any).layers as Map<string, { markers: Map<string, unknown> }>

    assert(!layers.has(MAP_MARKER_LAYERS.localDelivery), 'clearing one layer should remove only that layer')
    assert(layers.has(MAP_MARKER_LAYERS.orders), 'clearing one layer should keep other layers')
  }

  {
    const adapter = createAdapter()
    adapter.setMarkers([createOrder('default-1')])

    const layers = (adapter as any).layers as Map<string, { markers: Map<string, unknown> }>
    assert(
      layers.get(MAP_MARKER_LAYERS.default)?.markers.has('default-1') === true,
      'setMarkers should map to default layer',
    )
  }
}

