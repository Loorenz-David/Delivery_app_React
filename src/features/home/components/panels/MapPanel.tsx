import { useEffect, useRef } from 'react'

import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'

export const MapPanel = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapManager = useResourceManager('mapManager')

  useEffect(() => {
    let isMounted = true
    const container = mapContainerRef.current
    if (!container) {
      return
    }
    ;(async () => {
      try {
        const isMobileViewport = window.innerWidth < 1000
        const showDesktopControls = !isMobileViewport
        await mapManager.initialize(container, {
          center: { lat: 40.7128, lng: -74.006 },
          zoom: 12,
          theme: 'dark',
          controls: {
            zoomControl: showDesktopControls,
            mapTypeControl: showDesktopControls,
            fullscreenControl: showDesktopControls,
            streetViewControl: showDesktopControls,
            customControls: {
              locateButton: true,
              mapTypeToggle: isMobileViewport,
            },
          },
        })
        if (!isMounted) {
          return
        }
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isMounted) {
                return
              }
              const { latitude, longitude } = position.coords
              mapManager.getMap()?.setOptions({
                center: { lat: latitude, lng: longitude },
                zoom: 13,
              })
              mapManager.setUserLocationMarker({ lat: latitude, lng: longitude })
            },
            (error) => {
              console.warn('Failed to retrieve user location', error)
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
            },
          )
        }
      } catch (error) {
        console.error('Failed to initialize map', error)
      }
    })()

    return () => {
      isMounted = false
      mapManager.clearUserLocationMarker()
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [mapManager])

  return (
    <section className=" z-1 flex-1 border border-[var(--color-border)] bg-white/70"
      style={{position:"relative"}}
    >
      <div ref={mapContainerRef} className="h-full w-full" />
    </section>
  )
}
