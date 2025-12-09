import { useCallback, useEffect, useRef, useState } from 'react'

import type { ActionComponentProps } from '../../resources_manager/managers/ActionManager'
import type { AddressPayload } from '../../features/home/types/backend'
import { MapManager } from '../MapManager'
import { BasicButton } from '../../components/buttons/BasicButton'

export interface MapLocationPickerPayload {
  initialAddress?: AddressPayload | null
  onConfirm?: (address: AddressPayload) => void
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.006 }

export function LocationPickerPopup({
  payload,
  onClose,
  setPopupHeader,
}: ActionComponentProps<MapLocationPickerPayload>) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapManagerRef = useRef<MapManager | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressPayload | null>(payload?.initialAddress ?? null)
  const [selectedCoords, setSelectedCoords] = useState<google.maps.LatLngLiteral | null>(
    payload?.initialAddress?.coordinates ?? null,
  )
  const [resolvedCenter, setResolvedCenter] = useState<google.maps.LatLngLiteral | null>(
    payload?.initialAddress?.coordinates ?? null,
  )
  const initialZoom = payload?.initialAddress?.coordinates ? 15 : 12

  useEffect(() => {
    setPopupHeader?.(
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[var(--color-text)]">Pick location on map</span>
        <span className="text-xs text-[var(--color-muted)]">Drop the pin, then save your selection.</span>
      </div>,
    )
  }, [setPopupHeader])

  useEffect(() => {
    if (payload?.initialAddress?.coordinates) {
      setResolvedCenter(payload.initialAddress.coordinates)
      return
    }
    let cancelled = false
    if (!('geolocation' in navigator)) {
      setResolvedCenter(DEFAULT_CENTER)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return
        }
        const { latitude, longitude } = position.coords
        setResolvedCenter({ lat: latitude, lng: longitude })
      },
      () => {
        if (!cancelled) {
          setResolvedCenter(DEFAULT_CENTER)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      },
    )
    return () => {
      cancelled = true
    }
  }, [payload?.initialAddress])

  useEffect(() => {
    if (!resolvedCenter) {
      return
    }
    let isMounted = true
    const container = mapContainerRef.current
    if (!container) {
      return
    }

    const manager = new MapManager()
    mapManagerRef.current = manager
    setMapError(null)
    setIsMapReady(false)

    ;(async () => {
      try {
        await manager.initialize(container, {
          center: resolvedCenter,
          zoom: initialZoom,
          theme: 'common_map',
          controls: {
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          },
        })
        if (!isMounted) {
          return
        }
        await manager.enableLocationPicker({
          initialPosition: payload?.initialAddress?.coordinates ?? undefined,
          initialAddress: payload?.initialAddress ?? null,
          onSelect: (address, coords) => {
            if (!isMounted) {
              return
            }
            setSelectedAddress(address)
            setSelectedCoords(coords)
          },
        })
        if (!isMounted) {
          return
        }
        setIsMapReady(true)
      } catch (error) {
        console.error('Failed to initialize location picker', error)
        if (isMounted) {
          setMapError('Unable to load Google Maps. Please try again later.')
        }
      }
    })()

    return () => {
      isMounted = false
      mapManagerRef.current?.disableLocationPicker()
      mapManagerRef.current = null
    }
  }, [initialZoom, payload?.initialAddress, resolvedCenter])

  const handleSave = useCallback(() => {
    if (!selectedAddress) {
      return
    }
    payload?.onConfirm?.(selectedAddress)
    onClose()
  }, [onClose, payload, selectedAddress])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative flex-1 rounded-2xl border border-[var(--color-border)] bg-white">
        {!isMapReady && !mapError && (
          <div className="absolute inset-0 z-1 flex items-center justify-center text-sm text-[var(--color-muted)]">
            Loading map...
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 z-1 flex items-center justify-center px-6 text-center text-sm text-red-500">
            {mapError}
          </div>
        )}
        <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />
      </div>

      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Selection</p>
          <p className="mt-1 text-sm text-[var(--color-text)]">
            {selectedAddress?.raw_address ? selectedAddress.raw_address : 'Click anywhere on the map to drop the pin.'}
          </p>
          {selectedCoords && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </p>
          )}
        </div>

        <BasicButton
          params={{
            variant: 'primary',
            disabled: !selectedAddress,
            onClick: handleSave,
            className: 'w-full',
          }}
        >
          Save selection
        </BasicButton>
      </div>
    </div>
  )
}

export default LocationPickerPopup
