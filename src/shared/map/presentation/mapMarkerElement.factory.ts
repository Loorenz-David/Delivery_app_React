import type { MapOrder } from '../domain/entities/MapOrder'

export function applyMarkerContent(el: HTMLElement, label?: string) {
  const nextLabel = label ?? ''
  if (nextLabel) {
    el.textContent = nextLabel
    return
  }

  el.textContent = ''
  const dot = document.createElement('span')
  dot.className = 'map-marker__dot'
  el.appendChild(dot)
}

export function createMarkerElement(order: MapOrder) {
  const el = document.createElement('div')

  if (order.markerColor) {
    el.style.setProperty('--marker-bg', order.markerColor)
  } else {
    el.style.removeProperty('--marker-bg')
  }

  const interactionVariant = order.interactionVariant ?? 'default'
  el.className = 'map-marker'
  el.dataset.markerVariant = interactionVariant
  el.classList.add(`map-marker--variant-${interactionVariant}`)

  if (order.status) {
    el.classList.add(`${order.status}-marker`)
  }

  if (order.className) {
    el.classList.add(order.className)
  }

  applyMarkerContent(el, order.label)

  return el
}
