import { loadGoogleMaps } from '@/shared/google-maps/api/loadGoogleMaps'

import { MAP_MARKER_LAYERS } from '../domain/constants/markerLayers'
import type { MapOrder } from '../domain/entities/MapOrder'
import type { Route } from '../domain/entities/Route'
import type { Coordinates, MapAdapter, MapConfig } from '../domain/types'

type MapsLibrary = {
  Map: any
  marker: any
  Polyline: any
  LatLngBounds: any
}

type MarkerLibrary = {
  AdvancedMarkerElement: any
}

type LayerMarkerRecord = {
  marker: any
  el: HTMLElement
  order: MapOrder
}

type MarkerLayer = {
  visible: boolean
  markers: Map<string, LayerMarkerRecord>
}

const getInteractionVariant = (order: MapOrder) => order.interactionVariant ?? 'default'

const createMarkerElement = (order: MapOrder) => {
  const el = document.createElement('div')
  el.className = 'map-marker'
  const interactionVariant = getInteractionVariant(order)
  el.dataset.markerVariant = interactionVariant
  el.classList.add(`map-marker--variant-${interactionVariant}`)

  if (order.status) {
    el.classList.add(`${order.status}-marker`)
  }

  if (order.className) {
    el.classList.add(order.className)
  }

  el.textContent = order.label ?? ''
  return el
}

const applyMarkerElementAppearance = (
  el: HTMLElement,
  order: MapOrder,
  isSelected: boolean,
  isMultiSelected: boolean,
) => {
  const interactionVariant = getInteractionVariant(order)
  el.className = 'map-marker'
  el.dataset.markerVariant = interactionVariant
  el.classList.add(`map-marker--variant-${interactionVariant}`)

  if (order.status) {
    el.classList.add(`${order.status}-marker`)
  }

  if (order.className) {
    el.classList.add(order.className)
  }

  if (isSelected) {
    el.classList.add('map-marker--selected')
    el.classList.add(`map-marker--selected-${interactionVariant}`)
  }

  if (isMultiSelected) {
    el.classList.add('map-marker--multi-selected')
  }

  el.textContent = order.label ?? ''
}

const markerZIndex = (status?: string) => {
  if (status === 'start' || status === 'end') {
    return 1
  }

  return 10
}

export class GoogleMapAdapter implements MapAdapter {
  private map: any = null
  private MapCtor: any = null
  private PolylineCtor: any = null
  private LatLngBoundsCtor: any = null
  private AdvancedMarkerCtor: any = null
  private layers = new Map<string, MarkerLayer>()
  private routePolylines: any[] = []
  private selectedMarkerId: string | null = null
  private drawingManager: any = null
  private activeCircle: any = null
  private circleSelectionCallback: ((ids: string[]) => void) | null = null
  private multiSelectedIds = new Set<string>()
  private circleListeners: any[] = []
  private drawingCompleteListener: any = null

  async initialize(container: HTMLElement, options?: MapConfig) {
    const google = (await loadGoogleMaps()) as any
    const mapsLibrary = google.maps?.importLibrary
      ? ((await google.maps.importLibrary('maps')) as MapsLibrary)
      : null
    const markerLibrary = google.maps?.importLibrary
      ? ((await google.maps.importLibrary('marker')) as MarkerLibrary)
      : null

    this.MapCtor = mapsLibrary?.Map ?? google.maps?.Map ?? null
    this.PolylineCtor = mapsLibrary?.Polyline ?? google.maps?.Polyline ?? null
    this.LatLngBoundsCtor = mapsLibrary?.LatLngBounds ?? google.maps?.LatLngBounds ?? null
    this.AdvancedMarkerCtor =
      markerLibrary?.AdvancedMarkerElement ?? google.maps?.marker?.AdvancedMarkerElement ?? null

    if (!this.MapCtor) {
      throw new Error('Google Maps Map constructor is unavailable.')
    }
    if (!this.AdvancedMarkerCtor) {
      throw new Error('AdvancedMarkerElement is not available. Ensure the marker library is enabled.')
    }

    const center = options?.center ?? { lat: 0, lng: 0 }
    const zoom = options?.zoom ?? 12

    this.map = new this.MapCtor(container, {
      center,
      zoom,
      mapId: options?.mapId,
      disableDefaultUI: options?.disableDefaultUI ?? true,
    })
  }

  setMarkers(orders: MapOrder[]) {
    this.setLayerMarkers(MAP_MARKER_LAYERS.default, orders)
  }

  setLayerMarkers(layerId: string, orders: MapOrder[]) {
    if (!this.AdvancedMarkerCtor) return

    const layer = this.getOrCreateLayer(layerId)
    const nextIds = new Set(orders.map((order) => String(order.id)))

    Array.from(layer.markers.entries()).forEach(([id, entry]) => {
      if (!nextIds.has(id)) {
        entry.marker.map = null
        entry.el.onclick = null
        layer.markers.delete(id)
        this.multiSelectedIds.delete(id)
      }
    })

    orders.forEach((order) => {
      const id = String(order.id)
      const existing = layer.markers.get(id)

      if (existing) {
        existing.order = order
        existing.marker.position = order.coordinates
        existing.marker.zIndex = markerZIndex(order.status)
        applyMarkerElementAppearance(
          existing.el,
          order,
          this.selectedMarkerId === id,
          this.multiSelectedIds.has(id),
        )
        existing.el.onclick = (event: MouseEvent) => {
          this.selectMarker(id)
          order.onClick?.(event)
        }
        existing.marker.map = layer.visible ? this.map : null
        return
      }

      const content = createMarkerElement(order)
      content.onclick = (event: MouseEvent) => {
        this.selectMarker(id)
        order.onClick?.(event)
      }

      const marker = new this.AdvancedMarkerCtor({
        map: layer.visible ? this.map : null,
        position: order.coordinates,
        content,
        zIndex: markerZIndex(order.status),
      })

      if (this.selectedMarkerId === id) {
        content.classList.add('map-marker--selected')
        content.classList.add(`map-marker--selected-${getInteractionVariant(order)}`)
      }

      if (this.multiSelectedIds.has(id)) {
        content.classList.add('map-marker--multi-selected')
      }

      layer.markers.set(id, { marker, el: content, order })
    })

    if (layer.visible && orders.length) {
      this.fitBounds(orders.map((order) => order.coordinates))
    }
  }

  setLayerVisibility(layerId: string, visible: boolean) {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.visible = visible
    layer.markers.forEach(({ marker }) => {
      marker.map = visible ? this.map : null
    })
  }

  clearLayer(layerId: string) {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.markers.forEach(({ marker, el }, id) => {
      marker.map = null
      el.onclick = null
      this.multiSelectedIds.delete(id)
    })
    layer.markers.clear()
    this.layers.delete(layerId)

    if (layerId === MAP_MARKER_LAYERS.orders) {
      this.clearMultiSelectionStyles()
      this.multiSelectedIds.clear()
    }

    if (this.selectedMarkerId && !this.findMarkerEntryById(this.selectedMarkerId)) {
      this.selectedMarkerId = null
    }
  }

  enableCircleSelection(callback: (ids: string[]) => void) {
    if (!this.map) return

    this.circleSelectionCallback = callback
    this.ensureDrawingManager()

    if (!this.drawingManager) return

    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE)
  }

  disableCircleSelection() {
    this.circleSelectionCallback = null

    this.clearCircleListeners()
    if (this.activeCircle) {
      this.activeCircle.setMap(null)
      this.activeCircle = null
    }

    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(null)
    }

    this.clearMultiSelectionStyles()
    this.multiSelectedIds.clear()
  }

  clearMarkers() {
    this.layers.forEach((_layer, layerId) => {
      this.clearLayer(layerId)
    })
    this.selectedMarkerId = null
    this.disableCircleSelection()
  }

  selectMarker(id: string) {
    if (this.selectedMarkerId === id) return

    if (this.selectedMarkerId) {
      const previous = this.findMarkerEntryById(this.selectedMarkerId)
      if (previous) {
        const previousVariant = getInteractionVariant(previous.entry.order)
        previous.entry.el.classList.remove('map-marker--selected')
        previous.entry.el.classList.remove(`map-marker--selected-${previousVariant}`)
      }
    }

    const current = this.findMarkerEntryById(id)
    if (current) {
      const currentVariant = getInteractionVariant(current.entry.order)
      current.entry.el.classList.add('map-marker--selected')
      current.entry.el.classList.add(`map-marker--selected-${currentVariant}`)
    }

    this.selectedMarkerId = id
  }

  drawRoute(route: Route | null) {
    if (!this.map || !this.PolylineCtor) return

    this.routePolylines.forEach((p) => p.setMap(null))
    this.routePolylines = []

    if (!route || !route.path) return

    let encodedPolylines: string[] = []

    if (typeof route.path === 'string') {
      encodedPolylines = [route.path]
    } else if (Array.isArray(route.path) && typeof route.path[0] === 'string') {
      encodedPolylines = route.path as string[]
    } else {
      return
    }

    if (!google.maps.geometry?.encoding) {
      console.error('Google Maps geometry library is not loaded')
      return
    }

    const allPoints: Coordinates[] = []
    const PolylineCtor = this.PolylineCtor

    encodedPolylines.forEach((encoded) => {
      const decoded = google.maps.geometry.encoding.decodePath(encoded)

      const path = decoded.map((p: any) => ({
        lat: p.lat(),
        lng: p.lng(),
      }))

      const polyline = new PolylineCtor({
        map: this.map,
        path,
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 4,
      })

      this.routePolylines.push(polyline)
      allPoints.push(...path)
    })

    if (allPoints.length) {
      this.fitBounds(allPoints)
    }
  }

  fitBounds(points?: Coordinates[]) {
    if (!this.map || !this.LatLngBoundsCtor) return

    let resolvedPoints = points?.length ? points : this.getRoutePoints()
    if (!resolvedPoints.length) {
      resolvedPoints = this.getMarkerPoints()
    }
    if (!resolvedPoints.length) return

    if (resolvedPoints.length === 1) {
      this.map.setOptions({
        center: resolvedPoints[0],
        zoom: 14,
      })
      return
    }

    const bounds = new this.LatLngBoundsCtor()
    resolvedPoints.forEach((point) => bounds.extend(point))
    this.map.fitBounds(bounds, {
      top: 50,
      right: 900,
      bottom: 50,
      left: 50,
    })

    const MAX_ZOOM = 10
    const MIN_ZOOM = 10
    const currentZoom = this.map?.getZoom()

    if (typeof currentZoom === 'number' && currentZoom > MAX_ZOOM) {
      this.map.setZoom(MAX_ZOOM)
    }
    if (typeof currentZoom === 'number' && currentZoom > MIN_ZOOM) {
      this.map.setZoom(MIN_ZOOM)
    }
  }

  private ensureDrawingManager() {
    if (!this.map) return

    if (!google.maps.drawing?.DrawingManager) {
      console.error('Google Maps drawing library is not loaded')
      return
    }

    if (!this.drawingManager) {
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        circleOptions: {
          editable: true,
          draggable: true,
          fillColor: '#2563eb',
          fillOpacity: 0.12,
          strokeColor: '#1d4ed8',
          strokeOpacity: 0.9,
          strokeWeight: 2,
        },
      })
      this.drawingManager.setMap(this.map)
    }

    if (!this.drawingCompleteListener) {
      this.drawingCompleteListener = google.maps.event.addListener(
        this.drawingManager,
        'circlecomplete',
        (circle: any) => {
          this.handleCircleComplete(circle)
        },
      )
    }
  }

  private handleCircleComplete(circle: any) {
    this.clearCircleListeners()

    if (this.activeCircle) {
      this.activeCircle.setMap(null)
    }

    this.activeCircle = circle
    circle.setEditable(true)
    circle.setDraggable(true)

    this.circleListeners.push(
      google.maps.event.addListener(circle, 'center_changed', () => this.computeCircleSelection(circle)),
    )
    this.circleListeners.push(
      google.maps.event.addListener(circle, 'radius_changed', () => this.computeCircleSelection(circle)),
    )

    this.computeCircleSelection(circle)

    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(null)
    }
  }

  private computeCircleSelection(circle: any) {
    const ordersLayer = this.layers.get(MAP_MARKER_LAYERS.orders)

    if (!ordersLayer?.visible || !this.circleSelectionCallback) {
      this.applyMultiSelection([])
      this.circleSelectionCallback?.([])
      return
    }

    const center = circle?.getCenter?.()
    const radius = circle?.getRadius?.()

    if (!center || typeof radius !== 'number' || !google.maps.geometry?.spherical) {
      this.applyMultiSelection([])
      this.circleSelectionCallback([])
      return
    }

    const selectedIds: string[] = []

    ordersLayer.markers.forEach((entry, id) => {
      if (!entry.marker?.map) {
        return
      }

      const markerPosition = this.resolveMarkerPosition(entry.marker.position)
      if (!markerPosition) {
        return
      }

      const distance = google.maps.geometry.spherical.computeDistanceBetween(center, markerPosition)
      if (distance <= radius) {
        selectedIds.push(id)
      }
    })

    this.applyMultiSelection(selectedIds)
    this.circleSelectionCallback(selectedIds)
  }

  private resolveMarkerPosition(position: any): Coordinates | null {
    if (!position) return null

    if (typeof position.lat === 'function' && typeof position.lng === 'function') {
      return {
        lat: position.lat(),
        lng: position.lng(),
      }
    }

    if (typeof position.lat === 'number' && typeof position.lng === 'number') {
      return {
        lat: position.lat,
        lng: position.lng,
      }
    }

    return null
  }

  private applyMultiSelection(ids: string[]) {
    const nextIds = new Set(ids)
    const ordersLayer = this.layers.get(MAP_MARKER_LAYERS.orders)

    if (!ordersLayer) {
      this.multiSelectedIds = nextIds
      return
    }

    this.multiSelectedIds.forEach((id) => {
      if (!nextIds.has(id)) {
        const marker = ordersLayer.markers.get(id)
        marker?.el.classList.remove('map-marker--multi-selected')
      }
    })

    nextIds.forEach((id) => {
      const marker = ordersLayer.markers.get(id)
      marker?.el.classList.add('map-marker--multi-selected')
    })

    this.multiSelectedIds = nextIds
  }

  private clearMultiSelectionStyles() {
    const ordersLayer = this.layers.get(MAP_MARKER_LAYERS.orders)
    if (!ordersLayer) return

    ordersLayer.markers.forEach(({ el }) => {
      el.classList.remove('map-marker--multi-selected')
    })
  }

  private clearCircleListeners() {
    this.circleListeners.forEach((listener) => {
      listener?.remove?.()
      google.maps.event.removeListener(listener)
    })
    this.circleListeners = []
  }

  private getOrCreateLayer(layerId: string) {
    const existing = this.layers.get(layerId)
    if (existing) {
      return existing
    }

    const created: MarkerLayer = {
      visible: true,
      markers: new Map(),
    }

    this.layers.set(layerId, created)
    return created
  }

  private findMarkerEntryById(id: string): { layerId: string; entry: LayerMarkerRecord } | null {
    for (const [layerId, layer] of this.layers.entries()) {
      const entry = layer.markers.get(id)
      if (entry) {
        return { layerId, entry }
      }
    }

    return null
  }

  private getRoutePoints() {
    const points: Coordinates[] = []
    this.routePolylines.forEach((polyline) => {
      const path = (polyline as any).getPath?.()
      if (!path || typeof path.getArray !== 'function') return
      path.getArray().forEach((point: any) => {
        points.push({ lat: point.lat(), lng: point.lng() })
      })
    })
    return points
  }

  private getMarkerPoints() {
    const points: Coordinates[] = []

    this.layers.forEach((layer) => {
      if (!layer.visible) return

      layer.markers.forEach(({ marker }) => {
        const position = marker.position
        if (!position) return

        if (typeof (position as any).lat === 'function') {
          points.push({
            lat: (position as any).lat(),
            lng: (position as any).lng(),
          })
          return
        }

        const coords = position as Coordinates
        if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
          points.push(coords)
        }
      })
    })

    return points
  }

  destroy() {
    this.clearMarkers()

    if (this.drawingCompleteListener) {
      this.drawingCompleteListener.remove?.()
      google.maps.event.removeListener(this.drawingCompleteListener)
      this.drawingCompleteListener = null
    }

    if (this.drawingManager) {
      this.drawingManager.setMap(null)
      this.drawingManager = null
    }

    this.routePolylines.forEach((p) => p.setMap(null))
    this.routePolylines = []
    this.map = null
  }

  resize() {
    if (!this.map) return

    const center = this.map.getCenter()
    if (!center) return

    const normalizedCenter = {
      lat: center.lat(),
      lng: center.lng(),
    }

    google.maps.event.trigger(this.map, 'resize')

    this.map.setCenter(normalizedCenter)
  }
}
