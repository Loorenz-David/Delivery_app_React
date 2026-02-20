import type { MapAdapter, MapConfig } from '../types'
import type { MapOrder } from '../entities/MapOrder'
import type { Route } from '../entities/Route'

export class MapController {
  private adapter: MapAdapter

  constructor(adapter: MapAdapter) {
    this.adapter = adapter
  }

  async initialize(container: HTMLElement, options?: MapConfig) {
    await this.adapter.initialize(container, options)
  }

  selectMarker(id: string | number  ){

    this.adapter.selectMarker(String(id))
  }
  showOrders(orders: MapOrder[]) {
    this.adapter.setMarkers(orders)
  }

  showRoute(route: Route | null) {
    this.adapter.drawRoute(route)
  }

  fitTo(points?: MapOrder['coordinates'][]) {
    this.adapter.fitBounds(points)
  }

  resize(){
    this.adapter.resize()
  }

  clear() {
    this.adapter.clearMarkers()
    this.adapter.drawRoute(null)
  }

  destroy() {
    this.adapter.destroy()
  }
}
