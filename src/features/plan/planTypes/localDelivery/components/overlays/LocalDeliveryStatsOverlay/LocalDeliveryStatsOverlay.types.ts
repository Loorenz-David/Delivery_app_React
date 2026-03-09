export type LocalDeliveryDriverOverlayStats = {
  initials: string
  name: string
  registration: string
}

export type LocalDeliverySummaryMetric = {
  id: string
  label: string
  value: string
}

export type LocalDeliveryRouteSummaryStats = {
  rows: [
    [LocalDeliverySummaryMetric, LocalDeliverySummaryMetric, LocalDeliverySummaryMetric],
    [LocalDeliverySummaryMetric, LocalDeliverySummaryMetric, LocalDeliverySummaryMetric],
    [LocalDeliverySummaryMetric, LocalDeliverySummaryMetric, LocalDeliverySummaryMetric],
  ]
}

export type LocalDeliveryGaussianMetricFace = {
  id: string
  label: string
  displayValue: string
  progressValue: number
  accentClassName?: string
}

export type LocalDeliveryGaussianMetricCard = {
  id: string
  faces: LocalDeliveryGaussianMetricFace[]
}

export type LocalDeliveryConsumptionMetric = {
  id: string
  label: string
  displayValue: string
}

export type LocalDeliveryStatsOverlayData = {
  routeSummary: LocalDeliveryRouteSummaryStats
  driver: LocalDeliveryDriverOverlayStats
  gaussianCards: LocalDeliveryGaussianMetricCard[]
  consumptionMetrics: LocalDeliveryConsumptionMetric[]
}

export type LocalDeliveryStatsLayoutMode = 'wide' | 'medium' | 'narrow'
