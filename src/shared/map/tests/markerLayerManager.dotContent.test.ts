import { MAP_MARKER_LAYERS } from '../domain/constants/markerLayers'
import type { MapOrder } from '../domain/entities/MapOrder'
import { MarkerLayerManager } from '../infrastructure/markers/MarkerLayerManager'

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

const buildOrder = (id: string, overrides?: Partial<MapOrder>): MapOrder => ({
  id,
  coordinates: { lat: 10, lng: 20 },
  onClick: () => undefined,
  ...overrides,
})

const createManager = () =>
  new MarkerLayerManager({
    getMap: () => ({ id: 'mock-map' }),
    getAdvancedMarkerCtor: () => MockAdvancedMarker,
  } as any)

const getMarkerElement = (manager: MarkerLayerManager, layerId: string, markerId: string): HTMLElement => {
  const markerElement = manager.getLayer(layerId)?.markers.get(markerId)?.el
  assert(!!markerElement, `expected marker "${markerId}" in layer "${layerId}"`)
  return markerElement!
}

export const runMarkerLayerManagerDotContentTests = () => {
  {
    const manager = createManager()
    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1')])

    const initialElement = getMarkerElement(manager, MAP_MARKER_LAYERS.orders, 'order-1')
    assert(
      !!initialElement.querySelector('.map-marker__dot'),
      'unlabeled marker should render dot on initial creation',
    )

    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1', { markerColor: '#ff8800' })])
    const updatedWithoutLabel = getMarkerElement(manager, MAP_MARKER_LAYERS.orders, 'order-1')
    assert(updatedWithoutLabel === initialElement, 'same marker id should reuse existing marker element on update')
    assert(
      !!updatedWithoutLabel.querySelector('.map-marker__dot'),
      'unlabeled marker should keep dot after style update',
    )

    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1', { label: '3' })])
    const updatedWithLabel = getMarkerElement(manager, MAP_MARKER_LAYERS.orders, 'order-1')
    assert(!updatedWithLabel.querySelector('.map-marker__dot'), 'labeled marker should not render dot')
    assert(updatedWithLabel.textContent === '3', 'labeled marker should render label text')

    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1')])
    const revertedToDot = getMarkerElement(manager, MAP_MARKER_LAYERS.orders, 'order-1')
    assert(!!revertedToDot.querySelector('.map-marker__dot'), 'dot should return when label is removed')
  }

  {
    const manager = createManager()
    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1')])
    manager.setLayerMarkers(MAP_MARKER_LAYERS.localDelivery, [buildOrder('local-1', { label: '1' })])
    manager.clearLayer(MAP_MARKER_LAYERS.localDelivery)
    manager.setLayerMarkers(MAP_MARKER_LAYERS.orders, [buildOrder('order-1', { markerColor: '#00a3ff' })])

    const orderElement = getMarkerElement(manager, MAP_MARKER_LAYERS.orders, 'order-1')
    assert(
      !!orderElement.querySelector('.map-marker__dot'),
      'orders layer marker should keep dot after local delivery layer is toggled off',
    )
  }
}

