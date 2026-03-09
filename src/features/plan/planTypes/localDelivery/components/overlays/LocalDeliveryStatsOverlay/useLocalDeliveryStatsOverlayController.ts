import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import type { PayloadBase } from '@/features/home/types/types'
import { useOrdersByPlanId } from '@/features/order/store/orderHooks.store'
import { useLocalDeliveryPlanByPlanId } from '@/features/plan/planTypes/localDelivery/store/useLocalDeliveryPlan.selector'
import {
  selectRouteSolutionStopsBySolutionId,
  useRouteSolutionStopStore,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import { useSelectedRouteSolutionByLocalDeliveryPlanId } from '@/features/plan/planTypes/localDelivery/store/useRouteSolution.selector'
import { useTeamMemberByServerId } from '@/features/team/members/hooks/useTeamMemberSelectors'
import { useBaseControlls } from '@/shared/resource-manager/useResourceManager'

import type {
  LocalDeliveryGaussianMetricCard,
  LocalDeliveryStatsLayoutMode,
  LocalDeliveryStatsOverlayData,
} from './LocalDeliveryStatsOverlay.types'

const WIDE_LAYOUT_THRESHOLD = 1200
const MEDIUM_LAYOUT_THRESHOLD = 860

const formatDurationLabel = (seconds?: number | null) => {
  if (!Number.isFinite(seconds) || (seconds ?? 0) <= 0) return '0h 0m'
  const totalMinutes = Math.max(0, Math.round((seconds ?? 0) / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

const formatDistanceLabel = (meters?: number | null) => {
  if (!Number.isFinite(meters) || (meters ?? 0) <= 0) return '0 km'
  return `${Math.round((meters ?? 0) / 1000)} km`
}

const formatDistancePerStopLabel = (meters?: number | null, stopCount?: number | null) => {
  if (!Number.isFinite(meters) || !Number.isFinite(stopCount) || (stopCount ?? 0) <= 0) {
    return '0 km'
  }
  return `${((meters ?? 0) / (stopCount ?? 1) / 1000).toFixed(1)} km`
}

const formatStopsPerHourLabel = (stopCount?: number | null, totalSeconds?: number | null) => {
  if (!Number.isFinite(stopCount) || !Number.isFinite(totalSeconds) || (totalSeconds ?? 0) <= 0) {
    return '0.0'
  }
  const perHour = (stopCount ?? 0) / ((totalSeconds ?? 0) / 3600)
  return perHour.toFixed(1)
}

const parseDurationSeconds = (value?: string | null) => {
  if (!value) return 0

  const normalized = value.trim()
  const hhmmssMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(normalized)
  if (hhmmssMatch) {
    const hours = Number(hhmmssMatch[1] ?? 0)
    const minutes = Number(hhmmssMatch[2] ?? 0)
    const seconds = Number(hhmmssMatch[3] ?? 0)
    return (hours * 60 * 60) + (minutes * 60) + seconds
  }

  const isoMatch = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(normalized)
  if (isoMatch) {
    const hours = Number(isoMatch[1] ?? 0)
    const minutes = Number(isoMatch[2] ?? 0)
    const seconds = Number(isoMatch[3] ?? 0)
    return (hours * 60 * 60) + (minutes * 60) + seconds
  }

  return 0
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'NA'

const resolveOperationCounts = (
  routeSolutionStops: Array<{ order_id?: number | null }>,
  ordersById: Map<number, { operation_type?: string | null }>,
) => {
  let pickupCount = 0
  let dropoffCount = 0

  routeSolutionStops.forEach((stop) => {
    if (typeof stop.order_id !== 'number') return
    const operationType = ordersById.get(stop.order_id)?.operation_type
    if (operationType === 'pickup' || operationType === 'pickup_dropoff') pickupCount += 1
    if (operationType === 'dropoff' || operationType === 'pickup_dropoff') dropoffCount += 1
  })

  return { pickupCount, dropoffCount }
}

const resolveLayoutMode = (width: number): LocalDeliveryStatsLayoutMode => {
  if (width >= WIDE_LAYOUT_THRESHOLD) return 'wide'
  if (width >= MEDIUM_LAYOUT_THRESHOLD) return 'medium'
  return 'narrow'
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const buildGaussianCards = ({
  seed,
  totalStops,
  pickupCount,
  dropoffCount,
}: {
  seed: number
  totalStops: number
  pickupCount: number
  dropoffCount: number
}): LocalDeliveryGaussianMetricCard[] => {
  const onTimeStops = Math.min(totalStops, Math.max(0, Math.round(totalStops * (0.68 + ((seed % 9) / 100)))))
  const lateStops = Math.max(0, Math.min(totalStops - onTimeStops, Math.round(totalStops * 0.16)))
  const earlyStops = Math.max(0, totalStops - onTimeStops - lateStops)

  const volumeRatio = clampPercent(52 + ((seed * 5) % 33))
  const weightRatio = clampPercent(38 + ((seed * 7) % 41))

  const completedOrders = Math.max(0, Math.min(totalStops, pickupCount + dropoffCount - Math.round(totalStops * 0.1)))
  const failedOrders = Math.max(0, totalStops - completedOrders)

  return [
    {
      id: 'timing',
      faces: [
        { id: 'on-time', label: 'On time stops', displayValue: `${onTimeStops}`, progressValue: clampPercent(totalStops === 0 ? 0 : (onTimeStops / totalStops) * 100), accentClassName: 'bg-emerald-400' },
        { id: 'late', label: 'Late stops', displayValue: `${lateStops}`, progressValue: clampPercent(totalStops === 0 ? 0 : (lateStops / totalStops) * 100), accentClassName: 'bg-amber-400' },
        { id: 'early', label: 'Early stops', displayValue: `${earlyStops}`, progressValue: clampPercent(totalStops === 0 ? 0 : (earlyStops / totalStops) * 100), accentClassName: 'bg-sky-400' },
      ],
    },
    {
      id: 'capacity',
      faces: [
        { id: 'volume', label: 'Route capacity volume', displayValue: `${volumeRatio}%`, progressValue: volumeRatio, accentClassName: 'bg-cyan-400' },
        { id: 'weight', label: 'Route weight', displayValue: `${weightRatio}%`, progressValue: weightRatio, accentClassName: 'bg-violet-400' },
      ],
    },
    {
      id: 'completion',
      faces: [
        { id: 'completed-orders', label: 'Orders completed', displayValue: `${completedOrders}`, progressValue: clampPercent(totalStops === 0 ? 0 : (completedOrders / totalStops) * 100), accentClassName: 'bg-lime-400' },
        { id: 'failed-orders', label: 'Orders fail', displayValue: `${failedOrders}`, progressValue: clampPercent(totalStops === 0 ? 0 : (failedOrders / totalStops) * 100), accentClassName: 'bg-rose-400' },
      ],
    },
  ]
}

const buildStatsData = ({
  routeId,
  distanceMeters,
  travelTimeSeconds,
  serviceTimeSeconds,
  pickupCount,
  dropoffCount,
  totalStops,
  driverName,
}: {
  routeId: number | null
  distanceMeters?: number | null
  travelTimeSeconds?: number | null
  serviceTimeSeconds?: number | null
  pickupCount: number
  dropoffCount: number
  totalStops: number
  driverName: string
}): LocalDeliveryStatsOverlayData => {
  const seed = routeId ?? 0
  const distanceKm = Math.max(0, (distanceMeters ?? 0) / 1000)
  const drivingSeconds = travelTimeSeconds ?? 0
  const serviceSeconds = serviceTimeSeconds ?? 0
  const totalSeconds = drivingSeconds + serviceSeconds
  const fuelCost = Math.max(8.5, distanceKm * 0.15 + 4 + (seed % 3))
  const co2Value = Math.max(3.2, distanceKm * 0.115)

  return {
    routeSummary: {
      rows: [
        [
          { id: 'distance-total', label: 'total distance', value: formatDistanceLabel(distanceMeters) },
          { id: 'distance-avg-stop', label: 'distance / stop', value: formatDistancePerStopLabel(distanceMeters, totalStops) },
          { id: 'distance-empty', label: '', value: '' },
        ],
        [
          { id: 'duration-total', label: 'total duration', value: formatDurationLabel(totalSeconds) },
          { id: 'duration-driving', label: 'driving duration', value: formatDurationLabel(drivingSeconds) },
          { id: 'duration-service', label: 'service duration', value: formatDurationLabel(serviceSeconds) },
        ],
        [
          { id: 'stops-total', label: 'total stops', value: `${totalStops}` },
          { id: 'stops-dropoffs', label: 'dropoffs', value: `${dropoffCount}` },
          { id: 'stops-pickups', label: 'pickups', value: `${pickupCount}` },
        ],
      ],
    },
    driver: {
      initials: getInitials(driverName),
      name: driverName,
      registration: `LD-${String((seed % 900) + 100).padStart(3, '0')}`,
    },
    gaussianCards: buildGaussianCards({ seed, totalStops, pickupCount, dropoffCount }),
    consumptionMetrics: [
      { id: 'stops-per-hour', label: 'Stops / hour', displayValue: formatStopsPerHourLabel(totalStops, totalSeconds) },
      { id: 'fuel-cost', label: 'Fuel cost', displayValue: `${fuelCost.toFixed(1)} €` },
      { id: 'co2', label: 'Co2', displayValue: `${co2Value.toFixed(1)} kg` },
    ],
  }
}

export const useLocalDeliveryStatsOverlayController = () => {
  const baseControlls = useBaseControlls<PayloadBase>()
  const planId = baseControlls.payload?.planId ?? null
  const localDeliveryPlan = useLocalDeliveryPlanByPlanId(planId)
  const selectedRouteSolution = useSelectedRouteSolutionByLocalDeliveryPlanId(localDeliveryPlan?.id ?? null)
  const routeSolutionStops = useRouteSolutionStopStore(
    useShallow(selectRouteSolutionStopsBySolutionId(selectedRouteSolution?.id ?? null)),
  )
  const orders = useOrdersByPlanId(planId)
  const driver = useTeamMemberByServerId(selectedRouteSolution?.driver_id ?? null)
  const [hidden, setHidden] = useState(false)
  const [layoutMode, setLayoutMode] = useState<LocalDeliveryStatsLayoutMode>('wide')
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const ordersById = useMemo(
    () =>
      orders.reduce<Map<number, (typeof orders)[number]>>((acc, order) => {
        if (typeof order.id === 'number') {
          acc.set(order.id, order)
        }
        return acc
      }, new Map()),
    [orders],
  )

  useEffect(() => {
    setHidden(false)
  }, [selectedRouteSolution?.client_id])

  useEffect(() => {
    const element = overlayRef.current
    if (!element || typeof ResizeObserver === 'undefined') {
      return
    }

    const updateLayoutMode = () => {
      setLayoutMode(resolveLayoutMode(element.clientWidth))
    }

    const observer = new ResizeObserver(updateLayoutMode)
    observer.observe(element)
    updateLayoutMode()

    return () => observer.disconnect()
  }, [])

  const statsData = useMemo(() => {
    if (!selectedRouteSolution) return null

    const { pickupCount, dropoffCount } = resolveOperationCounts(routeSolutionStops, ordersById)
    const driverName = driver?.username ?? driver?.email?.split('@')[0] ?? 'Unassigned'
    const serviceTimeSeconds = routeSolutionStops.reduce(
      (total, stop) => total + parseDurationSeconds(stop.service_duration),
      0,
    )
    const totalStops = routeSolutionStops.length || selectedRouteSolution.stop_count || 0

    return buildStatsData({
      routeId: selectedRouteSolution.id ?? null,
      distanceMeters: selectedRouteSolution.total_distance_meters,
      travelTimeSeconds: selectedRouteSolution.total_travel_time_seconds,
      serviceTimeSeconds,
      pickupCount,
      dropoffCount,
      totalStops,
      driverName,
    })
  }, [driver?.email, driver?.username, ordersById, routeSolutionStops, selectedRouteSolution])

  return {
    hidden,
    layoutMode,
    overlayRef,
    statsData,
    hide: () => setHidden(true),
    show: () => setHidden(false),
  }
}
