import type { ReactNode } from 'react'

interface MapAreaProps {
  map: ReactNode
  mapOverlay?: ReactNode
}

export function MapArea({ map, mapOverlay }: MapAreaProps) {
  return <div className="relative h-full w-full">{map}{mapOverlay}</div>
}
