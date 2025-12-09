import { useCallback, useEffect, useMemo, useState } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DropDown } from '../../../../components/buttons/DropDown'
import { Field } from '../../../../components/forms/FieldContainer'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'
import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'
import type { ActionPayload } from '../../../../resources_manager/managers/ActionManager'
import type { ActiveSelection } from '../../../../resources_manager/managers/DataManager'
import type { RoutePayload, SavedOptimizations } from '../../types/backend'
import {
  applyOrderSequenceToOrders,
  normalizeSavedOptimizations,
  patchRouteInDataManager,
} from '../../utils/routeDataHelpers'
import { ChangeOptimizationService } from '../../api/deliveryService'
import type { DriverOption } from '../../api/optionServices'

interface RouteStatsSectionProps {
  payload?: ActionPayload
  onClose: () => void
}

const DEFAULT_STATS_PLACEHOLDER = '—'

export default function RouteStatsSection({ onClose }: RouteStatsSectionProps) {
  const { setHeaderActions } = useSectionPanel()
  const routesDataManager = useResourceManager('routesDataManager')
  const optionDataManager = useResourceManager('optionDataManager')
  const optionSnapshot = useDataManager(optionDataManager)
  const routesSnapshot = useDataManager(routesDataManager)
  const driversMap = optionSnapshot.dataset?.drivers_map ?? null
  const changeOptimizationService = useMemo(() => new ChangeOptimizationService(), [])
  const routeSelection =
    (routesSnapshot.activeSelections?.['SelectedRoute'] as ActiveSelection<RoutePayload> | undefined) ??
    routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
  const route = routeSelection?.data ?? null

  const savedOptimizations = useMemo(
    () => normalizeSavedOptimizations(route?.saved_optimizations ?? null),
    [route?.saved_optimizations],
  )
  const initialIndex = useMemo(() => resolveInitialOptimizationIndex(route, savedOptimizations), [route, savedOptimizations])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialIndex)
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | undefined>(
    initialIndex != null ? String(initialIndex) : undefined,
  )

  useEffect(() => {
    setSelectedIndex(initialIndex)
    setSelectedOptionValue(initialIndex != null ? String(initialIndex) : undefined)
  }, [initialIndex])

  useEffect(() => {
    setHeaderActions?.([
      <BasicButton
        key="close-route-stats"
        params={{
          variant: 'secondary',
          onClick: onClose,
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">Close</div>
      </BasicButton>,
    ])
    return () => {
      setHeaderActions?.([])
    }
  }, [onClose, setHeaderActions])

  const submit_save_optimization = useCallback(
    async (routeId: number, index: number) => {
      try {
        await changeOptimizationService.changeOptimization({
          route_id: routeId,
          using_optimization_indx: index,
        })
      } catch (error) {
        console.error('Failed to persist optimization index', error)
      }
    },
    [changeOptimizationService],
  )

  const optimizationOptions = useMemo(() => {
    return savedOptimizations.map((_, index, array) => ({
      value: String(index),
      display: labelForOptimization(index, array.length),
    }))
  }, [savedOptimizations])

  const selectedOptimization = selectedIndex != null ? savedOptimizations[selectedIndex] : null

  const handleOptimizationChange = useCallback(
    (value: string) => {
      if (!route) {
        return
      }
      const index = Number(value)
      if (Number.isNaN(index) || !savedOptimizations[index]) {
        return
      }
      setSelectedIndex(index)
      setSelectedOptionValue(String(index))
      const targetOptimization = savedOptimizations[index]
      patchRouteInDataManager({
        routesDataManager,
        routeId: route.id,
        updater: (currentRoute) => {
          let nextRoute: RoutePayload = {
            ...currentRoute,
            using_optimization_indx: index,
            expected_start_time: targetOptimization.expected_start_time ?? currentRoute.expected_start_time,
            expected_end_time: targetOptimization.expected_end_time ?? currentRoute.expected_end_time,
            set_start_time: targetOptimization.set_start_time ?? currentRoute.set_start_time,
            set_end_time: targetOptimization.set_end_time ?? currentRoute.set_end_time,
            start_location: targetOptimization.start_location ?? currentRoute.start_location,
            end_location: targetOptimization.end_location ?? currentRoute.end_location,
            total_distance_meters:
              targetOptimization.total_distance_meters ?? currentRoute.total_distance_meters,
            total_duration_seconds:
              targetOptimization.total_duration_seconds ?? currentRoute.total_duration_seconds,
          }

          if (targetOptimization.order_sequence) {
            nextRoute = {
              ...nextRoute,
              delivery_orders: applyOrderSequenceToOrders(
                currentRoute.delivery_orders ?? [],
                targetOptimization.order_sequence,
              ),
            }
          }

          return nextRoute
        },
      })
      submit_save_optimization(route.id, index)
    },
    [route, routesDataManager, savedOptimizations, submit_save_optimization],
  )

  if (!route) {
    return <div className="text-sm text-[var(--color-muted)]">Select a route to view statistics.</div>
  }

  const stats = buildStats(route, selectedOptimization, driversMap ?? undefined)
  const fullRowStats = stats.filter((stat) => stat.fullRow)
  const gridStats = stats.filter((stat) => !stat.fullRow)

  return (
    <div className="space-y-6 py-4">
      {optimizationOptions.length > 0 && (
        <Field label="Saved optimizations">
          <DropDown
            options={optimizationOptions}
            state={[
              selectedOptionValue,
              (value) => {
                const resolved = typeof value === 'function' ? value(selectedOptionValue) : value
                if (typeof resolved === 'string') {
                  handleOptimizationChange(resolved)
                }
              },
            ]}
            placeholder="Select optimization"
          />
        </Field>
      )}

      

      {gridStats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {gridStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[var(--color-border)] p-3">
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
              {stat.driver ? (
                <div className="mt-2 flex items-center gap-3">
                  <ProfilePicture
                    src={stat.driver.profilePicture}
                    initials={stat.driver.initials}
                    size={40}
                    alt={stat.driver.name}
                  />
                  <span className="text-base font-semibold text-[var(--color-text)]">{stat.value}</span>
                </div>
              ) : (
                <p className="text-base font-semibold text-[var(--color-text)]">{stat.value}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {fullRowStats.length > 0 && (
        <div className="flex flex-col gap-3 text-sm">
          {fullRowStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[var(--color-border)] p-3">
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
              {stat.driver ? (
                <div className="mt-2 flex items-center  gap-3">
                  <ProfilePicture
                    src={stat.driver.profilePicture}
                    initials={stat.driver.initials}
                    size={40}
                    alt={stat.driver.name}
                  />
                  <span className="text-base font-semibold text-[var(--color-text)]">{stat.value}</span>
                </div>
              ) : (
                <p className="text-base font-semibold text-[var(--color-text)]">{stat.value}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function resolveInitialOptimizationIndex(route: RoutePayload | null, saved: SavedOptimizations[]) {
  if (!route || !saved.length) {
    return null
  }
  if (typeof route.using_optimization_indx === 'number' && saved[route.using_optimization_indx]) {
    return route.using_optimization_indx
  }
  return saved.length - 1
}

function labelForOptimization(index: number, length: number) {
  if (index === length - 1) {
    return 'Last optimization'
  }
  if (index === length - 2) {
    return 'Previous optimization'
  }
  return 'First optimization'
}

interface DriverStatDetails {
  name: string
  profilePicture?: string | null
  initials: string
}

type StatEntry = {
  label: string
  value: string | number
  driver?: DriverStatDetails
  fullRow?: boolean
}

function buildStats(
  route: RoutePayload,
  optimization: SavedOptimizations | null | undefined,
  driversMap?: Record<number, DriverOption> | null,
): StatEntry[] {
  const ordersCount = route.delivery_orders?.length ?? 0
  const itemsCount = route.delivery_orders?.reduce((sum, order) => sum + (order.delivery_items?.length ?? 0), 0) ?? 0
  const totalDistance = formatDistance(optimization?.total_distance_meters ?? route.total_distance_meters)
  const totalDuration = formatDuration(optimization?.total_duration_seconds ?? route.total_duration_seconds)
  const totalVolume = formatNumericValue(route.total_volume)
  const totalWeight = formatNumericValue(route.total_weight)
  const driverDetails = resolveDriverDetails(route.driver_id, driversMap)
  const driverName = driverDetails?.name ?? (route.driver_id ? `Driver #${route.driver_id}` : 'Unassigned')
  const expectedStart = formatTimeOfDay(optimization?.expected_start_time ?? route.expected_start_time)
  const expectedEnd = formatTimeOfDay(optimization?.expected_end_time ?? route.expected_end_time)
  const setStart = formatTimeOfDay(optimization?.set_start_time ?? route.set_start_time)
  const setEnd = formatTimeOfDay(optimization?.set_end_time ?? route.set_end_time)
  const startLocation = optimization?.start_location?.raw_address ?? route.start_location?.raw_address ?? DEFAULT_STATS_PLACEHOLDER
  const endLocation = optimization?.end_location?.raw_address ?? route.end_location?.raw_address ?? DEFAULT_STATS_PLACEHOLDER

  return [
    { label: 'Orders count', value: ordersCount },
    { label: 'Items count', value: itemsCount },
    { label: 'Total distance', value: totalDistance },
    { label: 'Total time', value: totalDuration },
    { label: 'Total volume', value: totalVolume },
    { label: 'Total weight', value: totalWeight },
    { label: 'Expected start', value: expectedStart },
    { label: 'Expected end', value: expectedEnd },
    { label: 'Set start time', value: setStart },
    { label: 'Set end time', value: setEnd },
    { label: 'Assigned driver', value: driverName, driver: driverDetails ?? undefined, fullRow: true },
    { label: 'Start location', value: startLocation, fullRow: true },
    { label: 'End location', value: endLocation, fullRow: true },
    
  ]
}

function formatDistance(meters?: number | null) {
  if (meters == null) {
    return DEFAULT_STATS_PLACEHOLDER
  }
  const kilometers = meters / 1000
  return `${kilometers.toFixed(2)} km`
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) {
    return DEFAULT_STATS_PLACEHOLDER
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hrs}h ${mins}m`
}

function formatTimeOfDay(value?: string | null) {
  if (!value) {
    return DEFAULT_STATS_PLACEHOLDER
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatNumericValue(value?: number | null) {
  if (value == null) {
    return DEFAULT_STATS_PLACEHOLDER
  }
  return String(value)
}

function resolveDriverDetails(
  driverId?: number | null,
  driversMap?: Record<number, DriverOption> | null,
): DriverStatDetails | null {
  if (!driverId || !driversMap) {
    return null
  }
  const driver = driversMap[driverId]
  if (!driver) {
    return null
  }
  const name = driver.username || `Driver #${driverId}`
  const initials = buildInitials(name)
  return {
    name,
    profilePicture: driver.profile_picture,
    initials,
  }
}

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) {
    return '?'
  }
  const [first, second] = parts
  if (!second) {
    return first.charAt(0).toUpperCase()
  }
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
}
