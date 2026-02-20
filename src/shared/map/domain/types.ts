import type { MapOrder } from './entities/MapOrder'
import type { Route } from './entities/Route'

export type Coordinates = {
  lat: number
  lng: number
}

export type MapConfig = {
  center?: Coordinates
  zoom?: number
  mapId?: string
  disableDefaultUI?: boolean
}

export type MapBridge = {
  initialize: (container: HTMLElement | null, options?: MapConfig) => Promise<void>
  showOrders: (orders: MapOrder[]) => void
  showRoute: (route: Route | null) => void
  selectOrder: (id: number | string ) => void
  resize: ()=>void
}

export interface MapAdapter {
  initialize: (container: HTMLElement, options?: MapConfig) => Promise<void>
  setMarkers: (orders: MapOrder[]) => void
  clearMarkers: () => void
  drawRoute: (route: Route | null) => void
  fitBounds: (points?: Coordinates[]) => void
  selectMarker: (id:string) => void
  destroy: () => void
  resize: ()=> void

}
