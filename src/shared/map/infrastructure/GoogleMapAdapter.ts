import { loadGoogleMaps } from '@/shared/google-maps/api/loadGoogleMaps'

import { MAP_MARKER_LAYERS } from '../domain/constants/markerLayers'
import type { MapOrder } from '../domain/entities/MapOrder'
import type { Route } from '../domain/entities/Route'
import type { Coordinates, MapAdapter, MapConfig, MapViewportInsets } from '../domain/types'

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
  
  if (order.markerColor) {
    el.style.setProperty('--marker-bg', order.markerColor)
  } else {
    el.style.removeProperty('--marker-bg')
  }
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
  isHovered: boolean,
) => {
  const interactionVariant = getInteractionVariant(order)
  el.className = 'map-marker'
  if (order.markerColor) {
    el.style.setProperty('--marker-bg', order.markerColor)
  } else {
    el.style.removeProperty('--marker-bg')
  }
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

  if (isHovered) {
    el.classList.add('map-marker--hovered')
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

const DEFAULT_VIEWPORT_INSETS: MapViewportInsets = {
  top: 24,
  right: 24,
  bottom: 24,
  left: 24,
}

export class GoogleMapAdapter implements MapAdapter {
  private map: any = null
  private MapCtor: any = null
  private PolylineCtor: any = null
  private LatLngBoundsCtor: any = null
  private AdvancedMarkerCtor: any = null
  private layers = new Map<string, MarkerLayer>()
  private layerSnapshots = new Map<string, MapOrder[]>()
  private routePolylines: any[] = []
  private selectedMarkerId: string | null = null
  private hoveredMarkerId: string | null = null
  private drawingManager: any = null
  private activeCircle: any = null
  private circleSelectionCallback: ((ids: string[]) => void) | null = null
  private circleSelectionLayerId: string | null = null
  private multiSelectedIds = new Set<string>()
  private circleListeners: any[] = []
  private drawingCompleteListener: any = null
  private viewportInsets: MapViewportInsets = DEFAULT_VIEWPORT_INSETS

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
    this.applyViewportInsets()

    this.replayLayerSnapshots()
  }

  setMarkers(orders: MapOrder[]) {
    this.setLayerMarkers(MAP_MARKER_LAYERS.default, orders)
  }

  setLayerMarkers(layerId: string, orders: MapOrder[]) {
    const layer = this.getOrCreateLayer(layerId)
    this.layerSnapshots.set(layerId, orders)

    if (!this.AdvancedMarkerCtor) return

    const nextIds = new Set(orders.map((order) => String(order.id)))

    Array.from(layer.markers.entries()).forEach(([id, entry]) => {
      if (!nextIds.has(id)) {
        entry.marker.map = null
        entry.el.onclick = null
        entry.el.onmouseenter = null
        entry.el.onmouseleave = null
        layer.markers.delete(id)
        this.multiSelectedIds.delete(id)
      }
    })

    orders.forEach((order) => {
      const id = String(order.id)
      const existing = layer.markers.get(id)
      const isLayerActiveForMultiSelection = this.circleSelectionLayerId === layerId
      const isMultiSelected = isLayerActiveForMultiSelection && this.multiSelectedIds.has(id)

      if (existing) {
        existing.order = order
        existing.marker.position = order.coordinates
        existing.marker.zIndex = markerZIndex(order.status)
        applyMarkerElementAppearance(
          existing.el,
          order,
          this.selectedMarkerId === id,
          isMultiSelected,
          this.hoveredMarkerId === id,
        )
        existing.el.onclick = (event: MouseEvent) => {
          order.onClick?.(event)
        }
        existing.el.onmouseenter = (event: MouseEvent) => {
          order.onMouseEnter?.(event)
        }
        existing.el.onmouseleave = (event: MouseEvent) => {
          order.onMouseLeave?.(event)
        }
        existing.marker.map = layer.visible ? this.map : null
        return
      }

      const content = createMarkerElement(order)
      content.onclick = (event: MouseEvent) => {
        order.onClick?.(event)
      }
      content.onmouseenter = (event: MouseEvent) => {
        order.onMouseEnter?.(event)
      }
      content.onmouseleave = (event: MouseEvent) => {
        order.onMouseLeave?.(event)
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

      if (this.hoveredMarkerId === id) {
        content.classList.add('map-marker--hovered')
      }

      if (isMultiSelected) {
        content.classList.add('map-marker--multi-selected')
      }

      layer.markers.set(id, { marker, el: content, order })
    })

    if (this.selectedMarkerId && !this.findMarkerEntryById(this.selectedMarkerId)) {
      this.selectedMarkerId = null
    }
    if (this.hoveredMarkerId && !this.findMarkerEntryById(this.hoveredMarkerId)) {
      this.hoveredMarkerId = null
    }

    if (layer.visible && orders.length) {
      this.fitBounds(orders.map((order) => order.coordinates))
    }
  }

  setLayerVisibility(layerId: string, visible: boolean) {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.visible = visible
    const isLayerActiveForMultiSelection = this.circleSelectionLayerId === layerId
    layer.markers.forEach(({ marker, el }, id) => {
      marker.map = visible ? this.map : null
      if (!isLayerActiveForMultiSelection) {
        el.classList.remove('map-marker--multi-selected')
        return
      }
      if (this.multiSelectedIds.has(id)) {
        el.classList.add('map-marker--multi-selected')
      } else {
        el.classList.remove('map-marker--multi-selected')
      }
    })
  }

  clearLayer(layerId: string) {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.markers.forEach(({ marker, el }, id) => {
      marker.map = null
      el.onclick = null
      el.onmouseenter = null
      el.onmouseleave = null
      this.multiSelectedIds.delete(id)
    })
    layer.markers.clear()
    this.layers.delete(layerId)
    this.layerSnapshots.delete(layerId)

    if (layerId === this.circleSelectionLayerId) {
      this.clearMultiSelectionStyles(layerId)
      this.multiSelectedIds.clear()
    }

    if (this.selectedMarkerId && !this.findMarkerEntryById(this.selectedMarkerId)) {
      this.selectedMarkerId = null
    }
    if (this.hoveredMarkerId && !this.findMarkerEntryById(this.hoveredMarkerId)) {
      this.hoveredMarkerId = null
    }
  }

  enableCircleSelection(params: { layerId: string; callback: (ids: string[]) => void }) {
    if (!this.map) return

    this.circleSelectionCallback = params.callback
    this.circleSelectionLayerId = params.layerId
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

    this.clearMultiSelectionStyles(this.circleSelectionLayerId ?? undefined)
    this.multiSelectedIds.clear()
    this.circleSelectionLayerId = null
  }

  clearMarkers() {
    this.layers.forEach((_layer, layerId) => {
      this.clearLayer(layerId)
    })
    this.selectedMarkerId = null
    this.hoveredMarkerId = null
    this.disableCircleSelection()
  }

  selectMarker(id: string) {
    this.setSelectedMarker(id)
  }

  setSelectedMarker(id: string | null) {
    const normalizedId = id == null ? null : String(id)
    if (this.selectedMarkerId === normalizedId) return

    if (this.selectedMarkerId) {
      const previous = this.findMarkerEntryById(this.selectedMarkerId)
      if (previous) {
        const previousVariant = getInteractionVariant(previous.entry.order)
        previous.entry.el.classList.remove('map-marker--selected')
        previous.entry.el.classList.remove(`map-marker--selected-${previousVariant}`)
      }
    }

    this.selectedMarkerId = normalizedId
    if (!this.selectedMarkerId) return

    const current = this.findMarkerEntryById(this.selectedMarkerId)
    if (!current) return

    const currentVariant = getInteractionVariant(current.entry.order)
    current.entry.el.classList.add('map-marker--selected')
    current.entry.el.classList.add(`map-marker--selected-${currentVariant}`)
  }

  setHoveredMarker(id: string | null) {
    const normalizedId = id == null ? null : String(id)
    if (this.hoveredMarkerId === normalizedId) return

    if (this.hoveredMarkerId) {
      const previous = this.findMarkerEntryById(this.hoveredMarkerId)
      previous?.entry.el.classList.remove('map-marker--hovered')
    }

    this.hoveredMarkerId = normalizedId
    if (!this.hoveredMarkerId) return

    const current = this.findMarkerEntryById(this.hoveredMarkerId)
    current?.entry.el.classList.add('map-marker--hovered')
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
      const horizontalOffset = (this.viewportInsets.left - this.viewportInsets.right) / 2
      const verticalOffset = (this.viewportInsets.top - this.viewportInsets.bottom) / 2
      this.map.panBy?.(horizontalOffset, verticalOffset)
      return
    }

    const bounds = new this.LatLngBoundsCtor()
    resolvedPoints.forEach((point) => bounds.extend(point))
    this.map.fitBounds(bounds, this.viewportInsets)

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

  setViewportInsets(insets: MapViewportInsets) {
    this.viewportInsets = {
      top: Math.max(0, insets.top),
      right: Math.max(0, insets.right),
      bottom: Math.max(0, insets.bottom),
      left: Math.max(0, insets.left),
    }
    this.applyViewportInsets()
  }

  reframeToVisibleArea() {
    this.fitBounds()
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
    const activeLayerId = this.circleSelectionLayerId
    const selectedLayer = activeLayerId ? this.layers.get(activeLayerId) : null

    if (!selectedLayer?.visible || !this.circleSelectionCallback || !activeLayerId) {
      this.applyMultiSelection(activeLayerId ?? MAP_MARKER_LAYERS.default, [])
      this.circleSelectionCallback?.([])
      return
    }

    const center = circle?.getCenter?.()
    const radius = circle?.getRadius?.()

    if (!center || typeof radius !== 'number' || !google.maps.geometry?.spherical) {
      this.applyMultiSelection(activeLayerId, [])
      this.circleSelectionCallback([])
      return
    }

    const selectedIds: string[] = []

    selectedLayer.markers.forEach((entry, id) => {
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

    this.applyMultiSelection(activeLayerId, selectedIds)
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

  private applyMultiSelection(layerId: string, ids: string[]) {
    const nextIds = new Set(ids)
    const selectedLayer = this.layers.get(layerId)

    if (!selectedLayer) {
      this.multiSelectedIds = nextIds
      return
    }

    this.multiSelectedIds.forEach((id) => {
      if (!nextIds.has(id)) {
        const marker = selectedLayer.markers.get(id)
        marker?.el.classList.remove('map-marker--multi-selected')
      }
    })

    nextIds.forEach((id) => {
      const marker = selectedLayer.markers.get(id)
      marker?.el.classList.add('map-marker--multi-selected')
    })

    this.multiSelectedIds = nextIds
  }

  private clearMultiSelectionStyles(layerId?: string) {
    const selectedLayer = layerId ? this.layers.get(layerId) : null
    if (!selectedLayer) return

    selectedLayer.markers.forEach(({ el }) => {
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

  private replayLayerSnapshots() {
    if (!this.AdvancedMarkerCtor) return

    this.layerSnapshots.forEach((orders, layerId) => {
      this.setLayerMarkers(layerId, orders)
      const layer = this.layers.get(layerId)
      if (layer) {
        this.setLayerVisibility(layerId, layer.visible)
      }
    })
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

    this.applyViewportInsets()
    this.map.setCenter(normalizedCenter)
  }

  private applyViewportInsets() {
  
    if (!this.map) return
    this.map.setOptions({ padding: this.viewportInsets })
  }
}
