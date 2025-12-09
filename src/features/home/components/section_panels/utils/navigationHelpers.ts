import type { AddressPayload, OrderPayload } from '../../../types/backend'

export type NavigationService = 'google' | 'apple' | 'waze'

const NAVIGATION_PREFERENCE_KEY = 'preferred_navigation_service'

export function getStoredNavigationService(): NavigationService | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(NAVIGATION_PREFERENCE_KEY)
  if (value === 'google' || value === 'apple' || value === 'waze') {
    return value
  }
  return null
}

export function storeNavigationService(service: NavigationService) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAVIGATION_PREFERENCE_KEY, service)
}

export function buildNavigationUrl(address: AddressPayload, service: NavigationService): string | null {
  const { raw_address, coordinates } = address
  const encodedAddress = encodeURIComponent(raw_address ?? '')
  if (!encodedAddress) {
    return null
  }

  if (service === 'google') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
  }

  if (service === 'apple') {
    return `http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
  }

  // waze
  if (coordinates?.lat != null && coordinates?.lng != null) {
    return `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes`
  }
  return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`
}

export function openNavigationForOrder(order: OrderPayload, service: NavigationService) {
  const url = buildNavigationUrl(order.client_address, service)
  if (!url) {
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
