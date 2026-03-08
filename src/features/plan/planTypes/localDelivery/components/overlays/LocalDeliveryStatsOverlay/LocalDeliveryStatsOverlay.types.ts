export type LocalDeliveryDriverOverlayStats = {
  initials: string
  name: string
  registration: string
}

export type LocalDeliveryRouteSummaryStats = {
  distanceLabel: string
  durationLabel: string
  pickupCount: number
  dropoffCount: number
}

export type LocalDeliveryGaugeMetric = {
  type: 'gauge'
  id: string
  label: string
  value: number
  displayValue: string
  accentClassName?: string
}

export type LocalDeliveryValueMetric = {
  type: 'value'
  id: string
  label: string
  displayValue: string
}

export type LocalDeliveryOverlayMetric =
  | LocalDeliveryGaugeMetric
  | LocalDeliveryValueMetric

export type LocalDeliveryStatsOverlayData = {
  routeSummary: LocalDeliveryRouteSummaryStats
  driver: LocalDeliveryDriverOverlayStats
  metrics: LocalDeliveryOverlayMetric[]
}
