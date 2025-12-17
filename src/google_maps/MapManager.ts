import { loadGoogleMaps } from './loadGoogleMaps'
import { createOrderMarkerElement, type OrderMarkerStatus } from './components/OrderMarker'

import type { AddressPayload } from '../features/home/types/backend'

export type MapTheme = 'light' | 'dark' | 'common_map'

export interface MapManagerOptions {
  center: google.maps.LatLngLiteral
  zoom?: number
  theme?: MapTheme
  disableDefaultUI?: boolean
  controls?: MapControlsOptions
  mapId?: string
}

export interface MapControlsOptions {
  zoomControl?: boolean
  mapTypeControl?: boolean
  fullscreenControl?: boolean
  streetViewControl?: boolean
  customControls?: {
    locateButton?: boolean
    mapTypeToggle?: boolean
  }
}

export interface OrderMarkerDescriptor {
  id: number | string
  position: google.maps.LatLngLiteral
  label?: string
  status?: OrderMarkerStatus
  highlighted?: boolean
  onClick?: (orderId: number | string) => void
  color?: string
}

export interface PolylineDescriptor {
  id: number | string
  path: google.maps.LatLngLiteral[]
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
}

export interface LocationPickerOptions {
  status?: OrderMarkerStatus
  onSelect?: (payload: AddressPayload, coords: google.maps.LatLngLiteral) => void
  initialPosition?: google.maps.LatLngLiteral
  initialAddress?: AddressPayload | null
}

export class MapManager {
  private map: google.maps.Map | null = null
  private AdvancedMarkerCtor: typeof google.maps.marker.AdvancedMarkerElement | null = null
  private markers = new Map<number | string, google.maps.marker.AdvancedMarkerElement>()
  private markerMetadata = new Map<
    number | string,
    { label?: string; status?: OrderMarkerStatus; highlighted?: boolean }
  >()
  private polylines = new Map<number | string, google.maps.Polyline>()
  private geocoder: google.maps.Geocoder | null = null
  private locationPickerMarker: google.maps.marker.AdvancedMarkerElement | null = null
  private locationPickerListener: google.maps.MapsEventListener | null = null
  private locateControl: HTMLElement | null = null
  private mapTypeControl: HTMLElement | null = null
  private customControlContainer: HTMLElement | null = null
  private userLocationMarker: google.maps.marker.AdvancedMarkerElement | null = null
  private selectedMarkerId: number | string | null = null
  private pendingPadding: any | null = null
  private currentMapType: 'roadmap' | 'satellite' = 'roadmap'
  private initialMapId: string | null = null

  async initialize(container: HTMLElement, options: MapManagerOptions) {
    const google = (await loadGoogleMaps()) as any
    const mapsLibrary = google.maps?.importLibrary ? ((await google.maps.importLibrary('maps')) as any) : null
    const markerLibrary = google.maps?.importLibrary ? ((await google.maps.importLibrary('marker')) as any) : null

    const MapCtor = mapsLibrary?.Map ?? google.maps?.Map
    if (typeof MapCtor !== 'function') {
      throw new Error('Google Maps Map constructor is unavailable.')
    }
    this.initialMapId = options.mapId ?? getMapId(options.theme ?? 'light') ?? null
    this.map = new MapCtor(container, {
      center: options.center,
      zoom: options.zoom ?? 12,
      disableDefaultUI: options.disableDefaultUI ?? true,
      mapId: this.initialMapId,
    })

    this.AdvancedMarkerCtor =
      markerLibrary?.AdvancedMarkerElement ?? google.maps.marker?.AdvancedMarkerElement ?? null
    if (!this.AdvancedMarkerCtor) {
      throw new Error('AdvancedMarkerElement is not available. Ensure the marker library is enabled.')
    }
    this.geocoder = new google.maps.Geocoder()

    this.setTheme(options.theme ?? 'light')
    if (options.controls) {
      this.setControlsVisibility(options.controls)
    }
    if (this.pendingPadding && this.map) {
      this.map.setOptions({ padding: this.pendingPadding } as any)
      this.pendingPadding = null
    }
  }

  getMap() {
    return this.map
  }

  setTheme(theme: MapTheme) {
    if (!this.map) {
      return
    }
    const mapId = getMapId(theme)
    if (mapId) {
      this.map.setOptions({ mapId })
    }
  }

  setControlsVisibility(options: MapControlsOptions) {
    if (!this.map) {
      return
    }
    this.map.setOptions({
      zoomControl: options.zoomControl ?? true,
      mapTypeControl: options.mapTypeControl ?? false,
      fullscreenControl: options.fullscreenControl ?? false,
      streetViewControl: options.streetViewControl ?? false,
    })
    if (options.customControls?.locateButton) {
      this.renderLocateButton()
    } else if (!options.customControls?.locateButton) {
      this.removeLocateButton()
    }
    if (options.customControls?.mapTypeToggle) {
      this.renderMapTypeToggle()
    } else if (!options.customControls?.mapTypeToggle) {
      this.removeMapTypeToggle()
    }
  }

  clearMarkers() {
    for (const marker of this.markers.values()) {
      marker.map = null
    }
    this.markers.clear()
    this.markerMetadata.clear()
    this.selectedMarkerId = null
  }

  setPadding(padding: any) {
    this.pendingPadding = padding
    if (!this.map) {
      return
    }
    this.map.setOptions({ padding } as any)
  }

  removeMarker(id: number | string) {
    const marker = this.markers.get(id)
    if (!marker) {
      return
    }
    marker.map = null
    this.markers.delete(id)
    this.markerMetadata.delete(id)
    if (this.selectedMarkerId === id) {
      this.selectedMarkerId = null
    }
  }

  upsertMarker(descriptor: OrderMarkerDescriptor) {
    if (!this.map || !this.AdvancedMarkerCtor) {
      return
    }
    const existing = this.markers.get(descriptor.id)
    const content = createOrderMarkerElement({
      label: descriptor.label,
      status: descriptor.status,
      highlighted: descriptor.highlighted,
      color: descriptor.color,
    })
    if (existing) {
      existing.position = descriptor.position
      existing.content = content
      this.markerMetadata.set(descriptor.id, {
        label: descriptor.label,
        status: descriptor.status ?? 'pending',
        highlighted: descriptor.highlighted,
      })
      return existing
    }
    const marker = new this.AdvancedMarkerCtor!({
      position: descriptor.position,
      map: this.map,
      content,
    })
    if (descriptor.onClick) {
      marker.addListener('click', () => descriptor.onClick?.(descriptor.id))
    }
    this.markers.set(descriptor.id, marker)
    this.markerMetadata.set(descriptor.id, {
      label: descriptor.label,
      status: descriptor.status ?? 'pending',
      highlighted: descriptor.highlighted,
    })
    return marker
  }

  syncMarkers(descriptors: OrderMarkerDescriptor[], options?: { fitBounds?: boolean }) {
    const desiredIds = new Set(descriptors.map((descriptor) => descriptor.id))
    for (const id of this.markers.keys()) {
      if (!desiredIds.has(id)) {
        this.removeMarker(id)
      }
    }
    descriptors.forEach((descriptor) => this.upsertMarker(descriptor))
    if (options?.fitBounds ?? true) {
      this.fitBoundsToMarkers()
    }
  }

  updateMarkerStatus(id: number | string, status: OrderMarkerStatus, label?: string) {
    const marker = this.markers.get(id)
    if (!marker) {
      return
    }
    marker.content = createOrderMarkerElement({ label, status })
    this.markerMetadata.set(id, { label, status })
  }

  setUserLocationMarker(position: google.maps.LatLngLiteral) {
    if (!this.map || !this.AdvancedMarkerCtor) {
      return
    }
    if (this.userLocationMarker) {
      this.userLocationMarker.position = position
      return
    }
    this.userLocationMarker = new this.AdvancedMarkerCtor!({
      position,
      map: this.map,
      content: createUserLocationElement(),
      zIndex: 999,
    })
  }

  clearUserLocationMarker() {
    if (this.userLocationMarker) {
      this.userLocationMarker.map = null
      this.userLocationMarker = null
    }
  }

  clearPolylines() {
    for (const polyline of this.polylines.values()) {
      polyline.setMap(null)
    }
    this.polylines.clear()
  }

  removePolyline(id: number | string) {
    const polyline = this.polylines.get(id)
    if (!polyline) {
      return
    }
    polyline.setMap(null)
    this.polylines.delete(id)
  }

  upsertPolyline(descriptor: PolylineDescriptor) {
    if (!this.map) {
      return
    }
    const existing = this.polylines.get(descriptor.id)
    if (existing) {
      existing.setOptions({
        path: descriptor.path,
        strokeColor: descriptor.strokeColor,
        strokeOpacity: descriptor.strokeOpacity ?? 1,
        strokeWeight: descriptor.strokeWeight ?? 4,
      })
      return existing
    }
   
    const polyline = new google.maps.Polyline({
      path: descriptor.path,
      strokeColor: descriptor.strokeColor ?? '#3e7bff',
      strokeOpacity: descriptor.strokeOpacity ?? 1,
      strokeWeight: descriptor.strokeWeight ?? 4,
      map: this.map,
    })

    this.polylines.set(descriptor.id, polyline)

    return polyline
  }

  syncPolylines(descriptors: PolylineDescriptor[]) {

    const desiredIds = new Set(descriptors.map((descriptor) => descriptor.id))
    
    for (const id of this.polylines.keys()) {
      if (!desiredIds.has(id)) {
        this.removePolyline(id)
      }
    }

    descriptors.forEach((descriptor) => {
    
      this.upsertPolyline(descriptor)
    })

  }

  async enableLocationPicker(options: LocationPickerOptions) {
    if (!this.map || !this.AdvancedMarkerCtor) {
      return
    }
    this.disableLocationPicker()
    const markerStatus = options.status ?? 'pending'
    if (options.initialPosition) {
      this.locationPickerMarker = new this.AdvancedMarkerCtor!({
        position: options.initialPosition,
        map: this.map,
        content: createOrderMarkerElement({ label: '•', status: markerStatus }),
      })
      if (options.onSelect) {
        const payload =
          options.initialAddress ?? (await this.reverseGeocode(options.initialPosition))
        options.onSelect(payload, options.initialPosition)
      }
    }
    this.locationPickerListener = this.map.addListener('click', async (event) => {
      const latLng = event.latLng?.toJSON()
      if (!latLng) {
        return
      }
      if (!this.locationPickerMarker) {
        this.locationPickerMarker = new this.AdvancedMarkerCtor!({
          position: latLng,
          map: this.map!,
          content: createOrderMarkerElement({ label: '•', status: markerStatus }),
        })
      } else {
        this.locationPickerMarker.position = latLng
      }
      if (options.onSelect) {
        const payload = await this.reverseGeocode(latLng)
        options.onSelect(payload, latLng)
      }
    })
  }

  disableLocationPicker() {
    if (this.locationPickerListener) {
      this.locationPickerListener.remove()
      this.locationPickerListener = null
    }
    if (this.locationPickerMarker) {
      this.locationPickerMarker.map = null
      this.locationPickerMarker = null
    }
  }

  private async reverseGeocode(position: google.maps.LatLngLiteral): Promise<AddressPayload> {
    if (!this.geocoder) {
      throw new Error('Geocoder is not available.')
    }
    const { results } = await this.geocoder.geocode({ location: position })
    const best = results?.[0]
    if (!best) {
      return {
        raw_address: '',
        coordinates: position,
      }
    }
    const city =
      best.address_components?.find((component) => component.types.includes('locality'))?.long_name ?? null
    const country =
      best.address_components?.find((component) => component.types.includes('country'))?.long_name ?? null
    const postal_code =
      best.address_components?.find((component) => component.types.includes('postal_code'))?.long_name ?? null

    return {
      raw_address: best.formatted_address ?? '',
      city,
      country,
      postal_code,
      coordinates: position,
    }
  }

  private renderLocateButton() {
    if (!this.map) {
      return
    }
    const container = this.ensureControlContainer()
    if (!container) {
      return
    }
    this.removeLocateButton()
    const button = document.createElement('button')
    button.type = 'button'
    button.className =
      'map-control-locate rounded-full bg-white p-2 shadow-lg ring-1 ring-black/5 flex items-center justify-center'
    button.style.width = '42px'
    button.style.height = '42px'
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1f2937" width="20" height="20"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 3h-1.07a7.002 7.002 0 00-5.93-5.93V4a1 1 0 00-2 0v1.07a7.002 7.002 0 00-5.93 5.93H4a1 1 0 000 2h1.07a7.002 7.002 0 005.93 5.93V20a1 1 0 002 0v-1.07a7.002 7.002 0 005.93-5.93H21a1 1 0 000-2zM12 17a5 5 0 110-10 5 5 0 010 10z"/></svg>'
    button.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          this.map?.setOptions({
            center: { lat: latitude, lng: longitude },
            zoom: 14,
          })
          this.setUserLocationMarker({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.warn('Failed to retrieve user location', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
        },
      )
    })
    this.locateControl = button
    container.appendChild(button)
  }

  private renderMapTypeToggle() {
    if (!this.map) {
      return
    }
    const container = this.ensureControlContainer()
    if (!container) {
      return
    }
    this.removeMapTypeToggle()
    const button = document.createElement('button')
    button.type = 'button'
    button.className =
      'map-control-maptype rounded-full bg-white p-2 shadow-lg ring-1 ring-black/5 flex items-center justify-center'
    button.style.width = '42px'
    button.style.height = '42px'
    button.title = 'Switch map type'
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M12 4 4 8l8 4 8-4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/></svg>'
    button.addEventListener('click', () => {
      const nextType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap'
      this.setMapType(nextType)
    })
    this.mapTypeControl = button
    container.appendChild(button)
  }

  highlightMarker(id: number | string | null) {
    if (!this.map) {
      return
    }
    if (this.selectedMarkerId != null && this.selectedMarkerId !== id) {
      this.updateMarkerHighlight(this.selectedMarkerId, false)
    }
    const alreadyHighlighted =
      id != null && this.markerMetadata.get(id)?.highlighted === true && this.selectedMarkerId === id

    this.selectedMarkerId = id
    if (id == null) {
      return
    }
    if (!alreadyHighlighted) {
      this.updateMarkerHighlight(id, true)
      this.ensureMarkerInView(id)
    }
  }

  private updateMarkerHighlight(id: number | string, highlighted: boolean) {
    const marker = this.markers.get(id)
    const meta = this.markerMetadata.get(id)
    if (!marker || !meta) {
      return
    }
    marker.content = createOrderMarkerElement({
      label: meta.label,
      status: meta.status,
      highlighted,
    })
    this.markerMetadata.set(id, { ...meta, highlighted })
  }

  private ensureMarkerInView(id: number | string) {
    if (!this.map) {
      return
    }
    const map = this.map as any
    const marker = this.markers.get(id)
    if (!marker || !marker.position) {
      return
    }
    const position =
      typeof (marker.position as any)?.lat === 'function' && typeof (marker.position as any)?.lng === 'function'
        ? { lat: (marker.position as any).lat(), lng: (marker.position as any).lng() }
        : (marker.position as google.maps.LatLngLiteral)

    if (!position) {
      return
    }
    const bounds = map.getBounds?.()
    const isInBounds = typeof bounds?.contains === 'function' ? bounds.contains(position) : false
    if (!bounds || isInBounds) {
      return
    }

    map.panTo?.(position)
    const zoom = map.getZoom?.() ?? 14
    if (zoom < 14) {
      map.setZoom?.(14)
    }
  }

  private fitBoundsToMarkers() {
    if (!this.map || !this.markers.size) {
      return
    }
    const bounds = new google.maps.LatLngBounds()
    for (const marker of this.markers.values()) {
      if (marker.position) {
        bounds.extend(marker.position)
      }
    }
    if (bounds.isEmpty()) {
      return
    }
    this.map.fitBounds(bounds, 64)

    const listener = google.maps.event.addListenerOnce(this.map, 'idle', () => {
      google.maps.event.removeListener(listener)
      const zoom = this.map?.getZoom()
      if (zoom == null) {
        return
      }
      const cityZoom = 12
      if (zoom > cityZoom) {
        this.map?.setZoom?.(cityZoom)
      }
    })
  }

  private removeLocateButton() {
    if (this.locateControl) {
      const controlArray = this.map?.controls[google.maps.ControlPosition.RIGHT_BOTTOM]
      if (controlArray && this.locateControl.parentElement === this.customControlContainer) {
        this.locateControl.remove()
      }
      this.locateControl = null
    }
    this.cleanupControlContainer()
  }

  private removeMapTypeToggle() {
    if (this.mapTypeControl) {
      if (this.mapTypeControl.parentElement === this.customControlContainer) {
        this.mapTypeControl.remove()
      }
      this.mapTypeControl = null
    }
    this.cleanupControlContainer()
  }

  private setMapType(mode: 'roadmap' | 'satellite') {
    if (!this.map) {
      return
    }
    this.currentMapType = mode
    if (mode === 'satellite') {
      this.map.setOptions({
        mapTypeId: 'satellite',
        mapId: undefined,
      } as any)
    } else {
      this.map.setOptions({
        mapTypeId: 'roadmap',
        mapId: this.initialMapId ?? undefined,
      } as any)
    }
  }

  private ensureControlContainer() {
    if (!this.map) {
      return null
    }
    if (this.customControlContainer) {
      return this.customControlContainer
    }
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.flexDirection = 'row'
    container.style.gap = '8px'
    container.style.padding = '8px'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'flex-end'
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(container)
    this.customControlContainer = container
    return container
  }

  private cleanupControlContainer() {
    if (!this.customControlContainer) {
      return
    }
    if (this.customControlContainer.childElementCount > 0) {
      return
    }
    const controlArray = this.map?.controls[google.maps.ControlPosition.RIGHT_BOTTOM]
    const index = controlArray?.getArray().indexOf(this.customControlContainer) ?? -1
    if (controlArray && index > -1) {
      controlArray.removeAt(index)
    }
    this.customControlContainer = null
  }
  
}

function getMapId(theme: MapTheme) {
  if (theme === 'dark') {
    return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_DARK ?? import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
  }
  if (theme === 'common_map'){
    return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_COMON_MAP?? import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
  }
    
  return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_LIGHT ?? import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
}

function createUserLocationElement() {
  const container = document.createElement('div')
  container.style.width = '14px'
  container.style.height = '14px'
  container.style.borderRadius = '9999px'
  container.style.backgroundColor = '#2563eb'
  container.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.2)'
  return container
}
 
