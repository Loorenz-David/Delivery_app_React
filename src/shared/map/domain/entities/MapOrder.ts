import type { Coordinates } from '../types'

export type MapOrderStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | string

export type MapOrder = {
  id: string
  coordinates: Coordinates 
  status?: MapOrderStatus
  sequence?: number | null
  label?: string 
  onClick: (e:MouseEvent) => void
  className?: string
}
