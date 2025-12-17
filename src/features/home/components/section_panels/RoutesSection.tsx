import { useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { CalendarIcon, GridIcon, OrderIcon, PlusIcon } from '../../../../assets/icons'
import { CalendarRoutesView } from '../section_cards/CalendarRoutesView'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DropDown } from '../../../../components/buttons/DropDown'
import { RouteCard } from '../section_cards/RouteCard'
import type { OrderPayload, RoutePayload } from '../../types/backend'
import { DeliveryService, UpdateOrderService } from '../../api/deliveryService'

import type { ActionManager } from '../../../../resources_manager/managers/ActionManager'
import { useHomeStore } from '../../../../store/home/useHomeStore'


interface RoutesSectionProps {
    isCompact?: boolean
    onViewModeChange?: (mode: 'list' | 'calendar') => void
}
const RoutesSection = ({isCompact = false, onViewModeChange}:RoutesSectionProps) => {

    // Use Contexts
    const {setHeaderActions, setInteractionActions} = useSectionPanel()
    const popupManager  = useResourceManager('popupManager')
    const sectionManager = useResourceManager('sectionManager')
    const isMobile = useResourceManager('isMobileObject')
    const [deliveryService] = useState(() => new DeliveryService())
    const [updateOrderService] = useState(() => new UpdateOrderService())
    const [groupingMode, setGroupingMode] = useState<GroupingMode>('date')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
        if (typeof window === 'undefined') return 'list'
        const stored = window.localStorage.getItem('routes_view_mode')
        return stored === 'calendar' ? 'calendar' : 'list'
    })
    const routes = useHomeStore((state) => state.routes)
    const { findRouteById, findOrderById, selectRoute, selectOrder, updateRoute, optimisticUpdateRoutes } = useHomeStore.getState()
    // ____________________________________________________________________________________________________________


    // helper functions
    const buildOrders = useCallback(async (routeId: number)=>{
        let route:RoutePayload | null | undefined = findRouteById(routeId)
        if (route && route.is_unpack === false) {
            const refreshed = await deliveryService.fetchRouteById(routeId)
            if (refreshed) {
                updateRoute(routeId, () => refreshed)
                route = refreshed
            }
        }
        selectRoute(routeId, { routeId }, route ?? null)
        const hadExisting = sectionManager.closeByKey(['SingleOrder', 'OrdersSection','ItemSection','ChatSection'])
        const openOrders = () => {
          if (isMobile?.isMobile && typeof isMobile.setIsMobileMenuOpen === 'function') {
            isMobile.setIsMobileMenuOpen(false)
          }
          sectionManager.open({
            key:'OrdersSection',
            parentParams:{
              className: isMobile.isMobile ? 'w-full h-screen z-[4] relative' : 'w-[400px] z-[4] relative',
              label:'Orders', 
              icon:<OrderIcon className="app-icon h-4 w-4" />, 
              animation:'expand',
              borderLeft:'#dcdcdcff solid 2px'
          }
          })
        }
        if (hadExisting) {
          setTimeout(openOrders, 0)
        } else {
          openOrders()
        }
      }, [deliveryService, findRouteById, selectRoute, sectionManager, updateRoute])

    const moveOrderBetweenRoutes = useCallback(
        (orderId: number | null | undefined, sourceRouteId: number | null | undefined, targetRouteId: number | null | undefined) => {
            if (
                orderId == null ||
                sourceRouteId == null ||
                targetRouteId == null ||
                sourceRouteId === targetRouteId
            ) {
                return
            }

            let movedOrder: OrderPayload | null = null
            const previousSelection = useHomeStore.getState()
            const rollback = optimisticUpdateRoutes((currentRoutes) => {
                const sourceRoute = currentRoutes.find((route) => route.id === sourceRouteId)
                movedOrder = sourceRoute?.delivery_orders?.find((order) => order.id === orderId) ?? null
                if (!movedOrder) {
                    return currentRoutes
                }
                const movedItemsCount = movedOrder ? movedOrder.delivery_items?.length ?? 0 : 0
                return currentRoutes.map((route) => {
                    if (route.id === sourceRouteId) {
                        const filtered = (route.delivery_orders ?? []).filter((order) => order.id !== orderId)
                        const normalized = filtered.map((order, index) => ({
                            ...order,
                            delivery_arrangement: index + 1,
                        }))
                        return {
                            ...route,
                            delivery_orders: normalized,
                            total_orders: route.total_orders != null ? Math.max(route.total_orders - 1, 0) : normalized.length,
                            total_items:
                                route.total_items != null
                                    ? Math.max(route.total_items - movedItemsCount, 0)
                                    : undefined,
                        }
                    }
                    if (route.id === targetRouteId && movedOrder) {
                        const existing = [...(route.delivery_orders ?? [])]
                        const maxArrangement = existing.reduce<number>(
                            (max, order) =>
                                order.delivery_arrangement != null
                                    ? Math.max(max, order.delivery_arrangement)
                                    : max,
                            -1,
                        )
                        const nextArrangement = maxArrangement >= 0 ? maxArrangement + 1 : 0
                        const nextOrder: OrderPayload = {
                            ...(movedOrder as OrderPayload),
                            id: movedOrder.id,
                            route_id: targetRouteId,
                            delivery_arrangement: nextArrangement,
                        }
                        existing.push(nextOrder)
                        return {
                            ...route,
                            delivery_orders: existing,
                            total_orders: route.total_orders != null ? route.total_orders + 1 : existing.length,
                            total_items:
                                route.total_items != null
                                    ? route.total_items + movedItemsCount
                                    : undefined,
                        }
                    }
                    return route
                })
            })

            if (!movedOrder) {
                return
            }

            const movedOrderId = (movedOrder as OrderPayload).id
            const targetOrder = findOrderById(movedOrderId, targetRouteId)
            const arrangement = targetOrder?.delivery_arrangement ?? 0
            updateOrderService
                .updateOrder({
                    id: movedOrderId,
                    fields: {
                        route_id: targetRouteId,
                        delivery_arrangement: arrangement,
                    },
                })
                .catch((error) => {
                    console.error('Failed to update order route assignment', error)
                    rollback()
                })
            const originalRouteId = previousSelection.selectedRouteId ?? null
            const originalOrderId = previousSelection.selectedOrderId ?? null
            if (originalRouteId != null) {
                selectRoute(originalRouteId, { routeId: originalRouteId })
                const stillExists = originalOrderId ? findOrderById(originalOrderId, originalRouteId) : null
                selectOrder(stillExists ? originalOrderId : null, { routeId: originalRouteId })
            } else {
                selectRoute(null)
                selectOrder(null)
            }
        },
        [findOrderById, optimisticUpdateRoutes, selectOrder, selectRoute, updateOrderService],
    )

    const handleRouteDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        if (event.dataTransfer.types.includes('application/x-order-transfer')) {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
        }
    }, [])

    const handleRouteDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>, route: RoutePayload) => {
            if (!event.dataTransfer.types.includes('application/x-order-transfer')) {
                return
            }
            event.preventDefault()
            event.stopPropagation()
            const payload = event.dataTransfer.getData('application/x-order-transfer')
            if (!payload) {
                return
            }
            try {
                const parsed = JSON.parse(payload) as { orderId?: number; routeId?: number | null }
                const orderId = typeof parsed.orderId === 'number' ? parsed.orderId : null
                const sourceRouteId = typeof parsed.routeId === 'number' ? parsed.routeId : null
                moveOrderBetweenRoutes(orderId ?? null, sourceRouteId, route.id)
            } catch {
                // ignore invalid payload
            }
        },
        [moveOrderBetweenRoutes],
    )

    const handleDateDrop = useCallback(
        (dateKey: string, dateRoutes: RoutePayload[], event: React.DragEvent) => {
            if (!event.dataTransfer.types.includes('application/x-order-transfer')) {
                return
            }
            event.preventDefault()
            event.stopPropagation()
            const payload = event.dataTransfer.getData('application/x-order-transfer')
            if (!payload) {
                return
            }
            try {
                const parsed = JSON.parse(payload) as { orderId?: number; routeId?: number | null }
                const orderId = typeof parsed.orderId === 'number' ? parsed.orderId : null
                const sourceRouteId = typeof parsed.routeId === 'number' ? parsed.routeId : null
                if (orderId == null || sourceRouteId == null) {
                    return
                }
                if (dateRoutes.length === 0) {
                    popupManager.open({
                        key: 'FillRoute',
                        payload: {
                            mode: 'create',
                            deliveryDate: dateKey,
                            onComplete: (route: RoutePayload) => {
                                moveOrderBetweenRoutes(orderId, sourceRouteId, route.id)
                            },
                        },
                    })
                    return
                }
                if (dateRoutes.length === 1) {
                    moveOrderBetweenRoutes(orderId, sourceRouteId, dateRoutes[0].id)
                    return
                }
                // For multiple routes, expect drop on specific route card inside popover
            } catch {
                // ignore invalid payload
            }
        },
        [moveOrderBetweenRoutes, popupManager],
    )
    const groupedRoutes = useMemo(() => {
        const groups: Array<{ dateKey: string; label: string; routes: RoutePayload[] }> = []
        const indexMap = new Map<string, number>()

        routes.forEach((route) => {
            const { key, label } = resolveGroupingKey(route.delivery_date, groupingMode)
            let groupIndex = indexMap.get(key)
            if (groupIndex == null) {
                groupIndex = groups.length
                indexMap.set(key, groupIndex)
                groups.push({ dateKey: key, label, routes: [] })
            }
            groups[groupIndex].routes.push(route)
        })

        return groups
    }, [routes, groupingMode])

    // ____________________________________________________________________________________________________________


    // useEffects 
    useEffect(()=>{

        if(setHeaderActions){
            setHeaderActions( buildHeaderActions( { popupManager, isMobile: isMobile.isMobile } ) )
        }
        if( setInteractionActions ){
            setInteractionActions( buildInteractionActions( {
                popupManager,
                groupingMode,
                onGroupingChange: setGroupingMode,
                viewMode,
                onViewModeChange: (mode) => {
                    setViewMode(mode)
                    onViewModeChange?.(mode)
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem('routes_view_mode', mode)
                    }
                }
            } ) )
        }
        
    },[groupingMode, popupManager, setHeaderActions, setInteractionActions, viewMode])

    useEffect(() => {
        onViewModeChange?.(viewMode)
    }, [onViewModeChange, viewMode])
    // ____________________________________________________________________________________________________________


    const renderList = () => (
        <div className="space-y-6">
            {groupedRoutes.map((group) => (
                <RouteDateGroup key={`route-date-${group.dateKey}`} dateKey={group.dateKey} label={group.label}>
                    {group.routes.map((route) => (
                        <RouteCard
                            key={`Route_${route.id}`}
                            route={route}
                            compact={isMobile?.isMobile ?  false : isCompact}
                            onSelect={(selected) => buildOrders(selected.id)}
                            onRouteDragOver={handleRouteDragOver}
                            onRouteDrop={handleRouteDrop}
                        />
                    ))}
                </RouteDateGroup>
            ))}
        </div>
    )

    const renderCalendar = () => (
        <CalendarRoutesView
            routes={routes}
            onSelectRoute={(route) => buildOrders(route.id)}
            onRouteDrop={(route, event) => handleRouteDrop(event as unknown as React.DragEvent<HTMLDivElement>, route)}
            onDateDrop={handleDateDrop}
        />
    )

    return viewMode === 'calendar' ? renderCalendar() : renderList()
 }
 
 export default RoutesSection;



const dateOptions =[
    {value:'date',display:'By date'},
    {value:'week',display:'By week'}
]

interface BuildersProps{
    popupManager: ActionManager,
    isMobile?: boolean
}
const buildHeaderActions = ({popupManager, isMobile}:BuildersProps)=>{
    return [
         <BasicButton
            children={isMobile ? 
                <PlusIcon className="app-icon-dark h-5 w-5" />
                : '+ Route'}
            params={{
                variant:isMobile ? 'rounded' :'primary',
                onClick:()=>{popupManager.open({key:'FillRoute', payload:{mode:'create'}})}
            }}
        />
    ]
}
type GroupingMode = 'date' | 'week'

interface InteractionBuilderProps extends BuildersProps{
    groupingMode: GroupingMode
    onGroupingChange: (mode: GroupingMode)=>void
    viewMode: 'list' | 'calendar'
    onViewModeChange: (mode: 'list' | 'calendar') => void
}
const buildInteractionActions = ({ groupingMode, onGroupingChange, viewMode, onViewModeChange }:InteractionBuilderProps)=>{
    return[
        <DropDown
            options={dateOptions}
            className="w-36 z-1"
            state={[groupingMode, (value)=> onGroupingChange(value as GroupingMode)]}
        />,
         <BasicButton
            children={
                <span className="inline-flex items-center gap-2">
                    {viewMode === 'calendar' ? (
                        <GridIcon className="app-icon h-4 w-4" />
                    ) : (
                        <CalendarIcon className="app-icon h-4 w-4" />
                    )}
                    {viewMode === 'calendar' ? 'List' : 'Calendar'}
                </span>
            }
            params={{
                variant:'secondary',
                onClick:()=> onViewModeChange(viewMode === 'calendar' ? 'list' : 'calendar')
            }}
        />
    ]
}

function RouteDateGroup({ dateKey, label, children }: { dateKey: string; label?: string; children: ReactNode }) {
    const formatted = label ?? formatDateLabel(dateKey)
    return (
        <section className="">
            <div className="sticky top-0 z-0 bg-[var(--color-page)] py-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">{formatted}</p>
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    )
}

function normalizeDateKey(value: string | null | undefined) {
    if (!value) {
        return 'Unknown'
    }
    return value.split('T')[0] ?? value
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
export function formatDateLabel(dateKey: string) {
    if (dateKey === 'Unknown') {
        return 'Unknown Delivery Date'
    }
    const parsed = new Date(dateKey)
    if (Number.isNaN(parsed.getTime())) {
        return dateKey
    }
    return dateFormatter.format(parsed)
}

function resolveGroupingKey(value: string | null | undefined, mode: GroupingMode) {
    if (mode === 'week') {
        const { key, weekNumber, year } = normalizeWeekKey(value)
        const label = weekNumber != null ? `Week ${weekNumber} · ${year}` : 'Week (unknown)'
        return { key, label }
    }
    const key = normalizeDateKey(value)
    return { key, label: formatDateLabel(key) }
}

function normalizeWeekKey(value: string | null | undefined) {
    const date = value ? new Date(value) : null
    if (!date || Number.isNaN(date.getTime())) {
        return { key: 'week-unknown', weekNumber: null as number | null, year: null as number | null }
    }
    const { weekNumber, year } = getISOWeek(date)
    return {
        key: `week-${year}-${weekNumber}`,
        weekNumber,
        year,
    }
}

function getISOWeek(date: Date) {
    const target = new Date(date.valueOf())
    const dayNr = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = new Date(target.getFullYear(), 0, 4)
    const diff =
        (target.valueOf() - firstThursday.valueOf()) / 86400000
    const weekNumber = 1 + Math.floor(diff / 7)
    const year = target.getFullYear()
    return { weekNumber, year }
}
