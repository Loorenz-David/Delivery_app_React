import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useBaseControlls } from '@/shared/resource-manager/useResourceManager'
import type { PayloadBase } from '@/features/home/types/types'
import { useLocalDeliveryPlanByPlanId } from '@/features/plan/planTypes/localDelivery/store/useLocalDeliveryPlan.selector'
import { useSelectedRouteSolutionByLocalDeliveryPlanId } from '@/features/plan/planTypes/localDelivery/store/useRouteSolution.selector'
import {
  selectRouteSolutionStopsBySolutionId,
  useRouteSolutionStopStore,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import { useOrdersByPlanId } from '@/features/order/store/orderHooks.store'
import { useTeamMemberByServerId } from '@/features/team/members/hooks/useTeamMemberSelectors'

import { LOCAL_DELIVERY_STATS_OVERLAY_SCROLL_THRESHOLD } from './LocalDeliveryStatsOverlay.constants'
import type { LocalDeliveryStatsOverlayData } from './LocalDeliveryStatsOverlay.types'

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

const buildFakeStatsData = ({
  routeId,
  distanceMeters,
  travelTimeSeconds,
  pickupCount,
  dropoffCount,
  driverName,
}: {
  routeId: number | null
  distanceMeters?: number | null
  travelTimeSeconds?: number | null
  pickupCount: number
  dropoffCount: number
  driverName: string
}): LocalDeliveryStatsOverlayData => {
  const seed = routeId ?? 0
  const distanceKm = Math.max(0, (distanceMeters ?? 0) / 1000)
  const completionValue = Math.min(100, 58 + (seed % 27))
  const onTimeValue = Math.min(100, 37 + ((seed * 7) % 42))
  const fuelCost = Math.max(8.5, distanceKm * 0.15 + 4 + (seed % 3))
  const co2Value = Math.max(3.2, distanceKm * 0.115)

  return {
    routeSummary: {
      distanceLabel: formatDistanceLabel(distanceMeters),
      durationLabel: formatDurationLabel(travelTimeSeconds),
      pickupCount,
      dropoffCount,
    },
    driver: {
      initials: getInitials(driverName),
      name: driverName,
      registration: `LD-${String((seed % 900) + 100).padStart(3, '0')}`,
    },
    metrics: [
      {
        type: 'gauge',
        id: 'completion',
        label: 'Completed',
        value: completionValue,
        displayValue: `${completionValue} of 100`,
      },
      {
        type: 'gauge',
        id: 'on-time',
        label: 'On time rate',
        value: onTimeValue,
        displayValue: `${onTimeValue}%`,
      },
      {
        type: 'value',
        id: 'fuel-cost',
        label: 'Fuel cost',
        displayValue: `${fuelCost.toFixed(1)} €`,
      },
      {
        type: 'value',
        id: 'co2',
        label: 'Co2',
        displayValue: `${co2Value.toFixed(1)} kg`,
      },
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
  const [compactMetrics, setCompactMetrics] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

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

    const observer = new ResizeObserver(() => {
      setCompactMetrics(element.clientWidth < LOCAL_DELIVERY_STATS_OVERLAY_SCROLL_THRESHOLD)
    })

    observer.observe(element)
    setCompactMetrics(element.clientWidth < LOCAL_DELIVERY_STATS_OVERLAY_SCROLL_THRESHOLD)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!element || !compactMetrics) {
      setShowScrollHint(false)
      return
    }

    const updateState = () => {
      const hasOverflow = element.scrollWidth > element.clientWidth + 8
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 8
      setShowScrollHint(hasOverflow && !atEnd)
    }

    updateState()
    element.addEventListener('scroll', updateState, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateState)
      : null
    observer?.observe(element)

    return () => {
      element.removeEventListener('scroll', updateState)
      observer?.disconnect()
    }
  }, [compactMetrics, selectedRouteSolution?.client_id])

  const statsData = useMemo(() => {
    if (!selectedRouteSolution) return null

    const { pickupCount, dropoffCount } = resolveOperationCounts(routeSolutionStops, ordersById)
    const driverName = driver?.username ?? driver?.email?.split('@')[0] ?? 'Unassigned'

    return buildFakeStatsData({
      routeId: selectedRouteSolution.id ?? null,
      distanceMeters: selectedRouteSolution.total_distance_meters,
      travelTimeSeconds: selectedRouteSolution.total_travel_time_seconds,
      pickupCount,
      dropoffCount,
      driverName,
    })
  }, [driver?.email, driver?.username, ordersById, routeSolutionStops, selectedRouteSolution])

  return {
    hidden,
    compactMetrics,
    showScrollHint,
    overlayRef,
    scrollContainerRef,
    statsData,
    hide: () => setHidden(true),
    show: () => setHidden(false),
  }
}
