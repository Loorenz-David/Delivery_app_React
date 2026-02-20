import { loadGoogleMaps } from '@/shared/google-maps/api/loadGoogleMaps'
import type { MapAdapter, MapConfig, Coordinates } from '../domain/types'
import type { MapOrder } from '../domain/entities/MapOrder'
import type { Route } from '../domain/entities/Route'


type MapsLibrary = {
  Map: any
  marker: any
  Polyline: any
  LatLngBounds: any
}

type MarkerLibrary = {
  AdvancedMarkerElement: any
}

const createMarkerElement = (label?: string | null, status?:string | null) => {
  const el = document.createElement('div')
  el.className = 'map-marker'
  if(status){
    el.classList.add(`${status}-marker`) 
  }
  if (label) {
    el.textContent = label
  }
  return el
}

export class GoogleMapAdapter implements MapAdapter {
  private map: any = null
  private MapCtor: any = null
  private PolylineCtor: any = null
  private LatLngBoundsCtor: any = null
  private AdvancedMarkerCtor: any = null
  private markers = new Map< 
    string, 
    {
      marker: any
      el: HTMLElement
    }
  >()
  private routePolylines: any[] = []
  private selectedMarkerId: string | null = null

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
    if (!this.map || !this.AdvancedMarkerCtor) return
    const map = this.map
    const AdvancedMarkerCtor = this.AdvancedMarkerCtor

    const nextIds = new Set(orders.map((order) => String(order.id)))
    Array.from(this.markers.entries()).forEach(([id, marker]) => {
      if (!nextIds.has(id)) {
        marker.marker.map = null
        this.markers.delete(id)
      }
    })

    orders.forEach((order) => {
      const id = String(order.id)
      const position = order.coordinates
      const existing = this.markers.get(id)

      if (existing) {
        existing.marker.position = position
        existing.el.textContent = order.label ?? ''
        return
      }

      const content = createMarkerElement(order.label, order?.status)

      if (order.className){
        content.classList.add(order.className)
      }

      if(order.onClick){
        content.addEventListener("click",(event)=>{
          this.selectMarker(String(id))
          order.onClick?.(event as MouseEvent)
        })
      }
      const marker = new AdvancedMarkerCtor({
        map: map,
        position,
        content,
        zIndex:
          order.status === 'start'
            ? 1
            : order.status === 'end'
            ? 1
            : 10, // normal order markers above
      })
      this.markers.set(id, {marker:marker, el:content} )
    })

    if (orders.length) {
      this.fitBounds(orders.map((order) => order.coordinates))
    }
  }

  clearMarkers() {
    this.markers.forEach((marker) => {
      marker.marker.map = null
    })
    this.markers.clear()
  }

  selectMarker(id: string) {
    if (this.selectedMarkerId === id) return

    // Unselect previous
    if (this.selectedMarkerId) {
      const prev = this.markers.get(this.selectedMarkerId)
      prev?.el.classList.remove('map-marker--selected')
    }

    // Select new
    const current = this.markers.get(id)
    current?.el.classList.add('map-marker--selected')

    this.selectedMarkerId = id
  }

  drawRoute(route: Route | null) {
    if (!this.map || !this.PolylineCtor) return

    // Clear existing route
    this.routePolylines.forEach((p) => p.setMap(null))
    this.routePolylines = []

    if (!route || !route.path) return

    // Normalize path to array of encoded polylines
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
        map: this.map!,
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
    this.map.fitBounds(bounds,{
       top: 50,
        right: 900,
        bottom: 50,
        left:50
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
    this.markers.forEach(({ marker }) => {
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
    return points
  }

  destroy() {
    this.clearMarkers()
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
