import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useOrderDragAndDrop } from '../../hooks/useOrderDragAndDrop'
import { useItemActions } from '../../hooks/useItemActions'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { OrderCard } from '../section_cards/OrderCard'

import type { RoutePayload, OrderPayload, SavedOptimizations } from '../../types/backend'
import { UpdateOrderService } from '../../api/deliveryService'
import type { OrderMarkerDescriptor, PolylineDescriptor } from '../../../../google_maps/MapManager'
import type { ItemStateOption } from '../../api/optionServices'
import { SingleOrderIcon, ThunderIcon, StatsIcon, MessageIcon, PlusIcon, SettingIcon } from '../../../../assets/icons'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import type { MessagePayload } from '../../../../message_manager/MessageManagerContext'
import { useHomeStore } from '../../../../store/home/useHomeStore'
import { useMobileSectionHeader, type MobileHeaderAction } from '../../contexts/MobileSectionHeaderContext'
import { deriveOrderStateFromItems } from '../../utils/orderState'


interface BuildersProps{
    popupManager: ActionManager
    sectionManager?: ActionManager
    onClose?: ()=>void
    routeId?:number
    route?: RoutePayload | null
    showMessage?: (payload: MessagePayload) => void
    isMobile?: boolean
}

const buildHeaderActions = ({ onClose }:BuildersProps)=>{
    return [
         <BasicButton children={
            <div
                className=" text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] "
                >
                Close
            </div>
         } params={
            {
                variant:'secondary',
                onClick:()=>{ if(onClose) onClose() }
            }
            }
        />
    ]
}

interface InteractionActionsProps {
    onOpenStats: () => void
    onEditRoute: () => void
    onCreateOrder: () => void
    onSendMessages: () => void
    onOpenOptimization: () => void
}

const buildInteractionActions = ({ onOpenStats, onEditRoute, onCreateOrder, onSendMessages, onOpenOptimization }: InteractionActionsProps)=>{
    return[
         <BasicButton
            children={'Route Stats'}
            params={{
            variant:'secondary',
            onClick: onOpenStats
            }}
        />,
        <BasicButton
            children={'Edit Route'}
            params={{
            variant:'secondary',
            onClick:onEditRoute
            }}
        />,
        <BasicButton
            children={'+ Order'}
            params={{
            className:"w-[150px]",
            variant:'primary',
            onClick:onCreateOrder
            }}
        />,
        <BasicButton
            children={'Send Messages'}
            params={{
                variant:'secondary',
                className:"w-[130px]",
                onClick:onSendMessages
            }}
        />,
        
        <BasicButton
            children={'Optimization'}
            params={{
            variant:'secondary',
            onClick: onOpenOptimization
            }}
        />,
       
    ]
}

interface OrderSectionProps{
    payload?:ActionPayload
    onClose: ()=> void
}

const OrdersSection = ({
    onClose

}:OrderSectionProps) => {

     // Use Contexts
    const {setHeaderActions, setInteractionActions} = useSectionPanel()
    const popupManager  = useResourceManager('popupManager')
    const sectionManager = useResourceManager('sectionManager')
    const { showMessage } = useMessageManager()
    const mapManager = useResourceManager('mapManager')
    const isMobile = useResourceManager('isMobileObject')
    const mobileHeader = useMobileSectionHeader()
    const registerHeader = mobileHeader?.registerHeader
    const updateHeader = mobileHeader?.updateHeader
    const removeHeader = mobileHeader?.removeHeader
    
    const selectedRouteId = useHomeStore((s) => s.selectedRouteId)
    const selectedOrderId = useHomeStore((s) => s.selectedOrderId)

    const { findRouteById, selectRoute, selectOrder, updateRoute } = useHomeStore.getState()
    const itemStatesMap = useHomeStore((state) => state.itemStatesMap)
    const route:RoutePayload | undefined = selectedRouteId != null ? findRouteById(selectedRouteId) ?? undefined : undefined
    const routeId = route?.id
    const rawOrders = route?.delivery_orders ?? []
    const optimization = useMemo(() => (route ? resolveOptimization(route) : null), [route])
    const skippedShipmentIds = useMemo(
        () => optimization?.skipped_shipments?.map((entry) => entry.order_id) ?? [],
        [optimization],
    )
    const markerSignature = useMemo(
        () =>
            JSON.stringify(
                rawOrders.map((order) => ({
                    id: order.id,
                    coords: order.client_address?.coordinates ?? null,
                    arrangement: order.delivery_arrangement ?? null,
                })),
            ),
        [rawOrders],
    )
    const lastMarkerSignatureRef = useRef<string | null>(null)
    const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
    const { handleItemAction } = useItemActions({ route, routeId })
    const mobileHeaderIdRef = useRef<string | null>(null)
    const lastHeaderStateRef = useRef<{ title: string; orders: number; routeKey: string | null } | null>(null)

    const initialCleanupRef = useRef(true)
    // ____________________________________________________________________________________________________________


        
    
    // helper functions 

    const handleClose = useCallback(() => {
        selectRoute(null)
        selectOrder(null)
        onClose()
    }, [onClose, selectOrder, selectRoute])

    const openRouteStats = useCallback(() => {
        if (!sectionManager || !routeId) {
            return
        }
        const hadExisting = sectionManager.closeByKey(['RouteStatsSection'])
        const openSection = () =>
            sectionManager.open({
                key: 'RouteStatsSection',
                parentParams: {
                    className: isMobile?.isMobile ? 'w-full h-screen z-[5] absolute' : 'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
                    label: 'Route Stats',
                    icon:<StatsIcon className="app-icon h-6 w-6 text-[var(--color-primary)]"/>,
                    animation: 'expand',
                },
            })
        if (hadExisting) {
            setTimeout(openSection, 0)
        } else {
            openSection()
        }
    }, [isMobile?.isMobile, routeId, sectionManager])

    const openEditRoute = useCallback(() => {
        if (!routeId) {
            return
        }
        popupManager.open({key:'FillRoute', payload:{mode:'edit',routeId}})
    }, [popupManager, routeId])

    const openCreateOrder = useCallback(() => {
        if (!routeId) {
            return
        }
        popupManager.open({key:'FillOrder', payload:{mode:'create', routeId}})
    }, [popupManager, routeId])

    const openSendMessages = useCallback(() => {
        if (!route || !route.delivery_orders || route.delivery_orders.length === 0) {
            showMessage?.({ status: 400, message: 'Open a route with orders before sending messages.' })
            return
        }
        popupManager.open({
            key:'SendMessages',
            payload:{
                targets: route.delivery_orders,
                arrival_time_range: route.delivery_time_range ?? 30
            }
        })
    }, [popupManager, route, showMessage])

    const openOptimizationSection = useCallback(() => {
        if (!sectionManager || !routeId) {
            return
        }
        const hadExisting = sectionManager.closeByKey(['RouteOptimizationSection'])
        const openSection = () => {
            sectionManager.open({
                key: 'RouteOptimizationSection',
                payload: { routeId },
                parentParams: {
                    className: isMobile?.isMobile ? 'w-full h-screen z-[5] absolute' : 'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
                    label: 'Route Optimization',
                    icon: <ThunderIcon className="app-icon h-7 w-7 text-[var(--color-primary)]" />,
                    animation: 'expand',
                },
            })
        }
        if (hadExisting) {
            setTimeout(openSection, 0)
        } else {
            openSection()
        }
    }, [isMobile?.isMobile, routeId, sectionManager])


    const [updateOrderService] = useState(() => new UpdateOrderService())

    const sendArrangementUpdate = useCallback(
        async (orderId: number, arrangement: number) => {
            try {
                await updateOrderService.updateOrder({
                    id: orderId,
                    fields: { delivery_arrangement: arrangement },
                })
            } catch (error) {
                console.error('Failed to update delivery arrangement', error)
            }
        },
        [updateOrderService],
    )

    const toggleOrderExpansion = useCallback((orderId: number) => {
        setExpandedOrders((previous) => ({
            ...previous,
            [orderId]: !previous[orderId],
        }))
    }, [])

    useEffect(() => {
        setExpandedOrders((previous) => {
            if (!rawOrders.length) {
                return {}
            }
            const allowedIds = new Set(rawOrders.map((order) => order.id))
            const nextState: Record<number, boolean> = {}
            allowedIds.forEach((id) => {
                if (previous[id]) {
                    nextState[id] = true
                }
            })
            return nextState
        })
    }, [rawOrders])

    const persistOrderSequence = useCallback(
        (nextOrders: OrderPayload[], meta?: { movedOrderId?: number | null }) => {
            if (!route) {
                return
            }

            const normalizedOrders = nextOrders.map((order, index) => ({
                ...order,
                delivery_arrangement: index,
            }))

            updateRoute(route.id, (entry) => ({
                ...entry,
                delivery_orders: normalizedOrders,
            }))

            if (selectedOrderId != null) {
                const updatedOrder = normalizedOrders.find((order) => order.id === selectedOrderId) ?? null
                if (updatedOrder) {
                    selectOrder(selectedOrderId, { routeId: route.id })
                }
            }
            if (meta?.movedOrderId != null) {
                const updatedOrder = normalizedOrders.find((order) => order.id === meta.movedOrderId)
                if (updatedOrder) {
                    sendArrangementUpdate(updatedOrder.id, updatedOrder.delivery_arrangement ?? 0)
                }
            }
        },
        [route, selectedOrderId, sendArrangementUpdate, selectOrder, updateRoute],
    )
    

    const {
        orders,
        draggingId,
        dropIndicator,
        handleDragStart,
        handleDragOverCard,
        handleDropOnCard,
        handleDropAtEnd,
        handleListDragOver,
        handleListDrop,
        finishDrag,
        setDropIndicator
    } = useOrderDragAndDrop({
        ordersInput: rawOrders,
        onReorder: persistOrderSequence,
        sourceRouteId: routeId ?? null,
    })

    const buildSectionSingleOrder = useCallback((orderId:number)=>{
        selectOrder(orderId, { routeId: route?.id ?? null })
        mapManager.highlightMarker(orderId)

        if (!sectionManager.hasKey('SingleOrder')) {
            sectionManager.open({
                key:'SingleOrder',
                parentParams:{
                    className:isMobile.isMobile ? 'w-full h-full absolute top-0 z-[5] ' : 'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
                    label:"Order details", 
                    icon:<SingleOrderIcon className="app-icon h-4 w-4" />,
                    animation:'expand',
                    }
                })
        }
        }, [mapManager, rawOrders, route?.id, sectionManager, selectOrder])
    // ____________________________________________________________________________________________________________


    useEffect(() => {
        return () => {
            if (initialCleanupRef.current) {
                initialCleanupRef.current = false
                return
            }
            selectRoute(null)
            selectOrder(null)
        }
    }, [selectOrder, selectRoute])

    // useEffects 
    useEffect(()=>{

        if(!setHeaderActions || !setInteractionActions){
            return
        }
        if(isMobile?.isMobile){
            setHeaderActions([])
            setInteractionActions([])
            return
        }
        setHeaderActions( buildHeaderActions( { popupManager, onClose: handleClose } ) )
        setInteractionActions(
            buildInteractionActions({
                onOpenStats: openRouteStats,
                onEditRoute: openEditRoute,
                onCreateOrder: openCreateOrder,
                onSendMessages: openSendMessages,
                onOpenOptimization: openOptimizationSection,
            })
        )
        
        
    },[
        handleClose,
        isMobile?.isMobile,
        openCreateOrder,
        openEditRoute,
        openOptimizationSection,
        openRouteStats,
        openSendMessages,
        popupManager,
        setHeaderActions,
        setInteractionActions
    ])

    useEffect(() => {
        if (!removeHeader) {
            return
        }
        return () => {
            if (mobileHeaderIdRef.current) {
                removeHeader(mobileHeaderIdRef.current)
                mobileHeaderIdRef.current = null
            }
        }
    }, [removeHeader])

    useEffect(() => {
        if (!registerHeader || !updateHeader || !removeHeader) {
            return
        }
        if (!isMobile?.isMobile) {
            if (mobileHeaderIdRef.current) {
                removeHeader(mobileHeaderIdRef.current)
                mobileHeaderIdRef.current = null
            }
            return
        }

        const headerTitle = route?.route_label ?? 'Orders'
        const headerKey = route ? `${route.id}-${route.route_label ?? ''}` : 'no-route'
        const headerOrdersCount = rawOrders.length
        const secondaryContent = route ? (
            <div className="flex w-full items-center justify-between gap-2">
                
                <span className="text-xs text-[var(--color-muted)]">{headerOrdersCount} orders</span>
            </div>
        ) : (
            <span className="text-sm text-[var(--color-muted)]">Select a route to manage orders.</span>
        )

        const menuActions: MobileHeaderAction[] = [
            {
                label: 'Route Stats',
                icon: <StatsIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openRouteStats,
            },
            {
                label: 'Edit Route',
                icon: <SettingIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openEditRoute,
            },
            {
                label: '+ Order',
                icon: <PlusIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openCreateOrder,
            },
            {
                label: 'Send Messages',
                icon: <MessageIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openSendMessages,
            },
            {
                label: 'Optimization',
                icon: <ThunderIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openOptimizationSection,
            },
        ]

        const nextHeaderState = { title: headerTitle, orders: headerOrdersCount, routeKey: headerKey }
        const prevHeaderState = lastHeaderStateRef.current

        if (!mobileHeaderIdRef.current) {
            mobileHeaderIdRef.current = registerHeader({
                title: headerTitle,
                onBack: handleClose,
                menuActions,
                secondaryContent,
            })
            lastHeaderStateRef.current = nextHeaderState
        } else {
            const hasChanged =
                !prevHeaderState ||
                prevHeaderState.title !== nextHeaderState.title ||
                prevHeaderState.orders !== nextHeaderState.orders ||
                prevHeaderState.routeKey !== nextHeaderState.routeKey

            if (hasChanged) {
                updateHeader(mobileHeaderIdRef.current, {
                    title: headerTitle,
                    onBack: handleClose,
                    menuActions,
                    secondaryContent,
                })
                lastHeaderStateRef.current = nextHeaderState
            }
        }
    }, [
        handleClose,
        isMobile?.isMobile,
        openCreateOrder,
        openEditRoute,
        openOptimizationSection,
        openRouteStats,
        openSendMessages,
        registerHeader,
        removeHeader,
        rawOrders.length,
        route?.route_label,
        route,
        updateHeader,
    ])

    useEffect(() => {
        if (!route) {
            mapManager.clearMarkers()
            mapManager.clearPolylines()
            mapManager.highlightMarker(null)
            return
        }

        const markers: OrderMarkerDescriptor[] = []
        const startCoords = route.start_location?.coordinates
        if (startCoords) {
            markers.push({
                id: 'route-start',
                position: startCoords,
                label: 'S',
                status: 'default' as const,
            })
        }
        markers.push(
            ...rawOrders.flatMap((order, index) => {
            const coords = order.client_address?.coordinates
            if (!coords) {
                return []
            }
            const state = deriveOrderStateFromItems(order.delivery_items ?? [], itemStatesMap as Record<number, ItemStateOption>)
            const markerColor = state?.color
            const label =
                order.delivery_arrangement != null ? String(order.delivery_arrangement + 1) : String(index + 1)
            return [
                {
                    id: order.id,
                    position: coords,
                    label,
                    status: 'pending' as const,
                    color: markerColor,
                    onClick: () => buildSectionSingleOrder(order.id),
                },
            ]
                })
        )
        const endCoords = route.end_location?.coordinates
        if (endCoords) {
            markers.push({
                id: 'route-end',
                position: endCoords,
                label: 'E',
                status: 'default' as const,
            })
        }
        const markersChanged = markerSignature !== lastMarkerSignatureRef.current
        mapManager.syncMarkers(markers, { fitBounds: markersChanged })
        lastMarkerSignatureRef.current = markerSignature
        if (selectedOrderId) {
            mapManager.highlightMarker(selectedOrderId)
        }

        if (optimization?.polylines) {
            const polylineDescriptors: PolylineDescriptor[] = Object.entries(optimization.polylines)
                .flatMap(([key, encoded]) => {
                    console.log('Encoded polyline for', key)
                    if (!encoded) {
                        return []
                    }
                    return [
                        {
                            id: `polyline-${key}`,
                            path: decodePolyline(encoded),
                            // strokeColor: key === 'start' || key === 'end' ? '#10b981' : '#2563eb',
                            // strokeWeight: key === 'start' || key === 'end' ? 3 : 4,
                            strokeOpacity: 0.85,
                        },
                    ]
                })
            mapManager.syncPolylines(polylineDescriptors)
        } else {
            mapManager.clearPolylines()
        }

    }, [buildSectionSingleOrder, mapManager, markerSignature, optimization, rawOrders, route, selectedOrderId])

    useEffect(() => {
        return () => {
            mapManager.clearMarkers()
            mapManager.clearPolylines()
        }
    }, [mapManager])

    useEffect(() => {
        mapManager.highlightMarker(selectedOrderId ?? null)
    }, [mapManager, selectedOrderId])
    // ____________________________________________________________________________________________________________



    return ( 
        <div className="space-y-4">

                <div
                    className="space-y-3 py-4"
                    onDragOver={handleListDragOver}
                    onDrop={handleListDrop}
                >
                    {orders.map((order) => (
                        
                        <OrderCard
                            key={`Order_${order.id}`}
                            order={order}
                            isExpanded={!!expandedOrders[order.id]}
                            isSkipped={skippedShipmentIds.includes(order.id)}
                            isDragging={draggingId === order.id}
                            onSelect={buildSectionSingleOrder}
                            onToggleExpand={() => toggleOrderExpansion(order.id)}
                            onItemAction={(action, itemId, data) => handleItemAction(order, action, itemId, data)}
                            dropIndicator={dropIndicator && dropIndicator.id === order.id ? dropIndicator.position : null}
                            dragHandleProps={{
                                draggable: true,
                                onDragStart: (event) => handleDragStart(event, order.id),
                                onDragEnd: finishDrag,
                                'aria-grabbed': draggingId === order.id,
                            }}
                            onDragOver={(event) => handleDragOverCard(event, order.id)}
                            onDrop={(event) => handleDropOnCard(event, order.id)}
                        />
                    ))}

                    <div
                        className="h-4"
                        onDragOver={(event) => {
                            if (!draggingId) return
                            event.preventDefault()
                            if (orders.length > 0) {
                                setDropIndicator({ id: orders[orders.length - 1].id, position: 'after' })
                            }
                        }}
                        onDrop={handleDropAtEnd}
                    />
                </div>

        </div>
     );
}
 
export default OrdersSection;


function resolveOptimization(route: RoutePayload) {
    const saved = route.saved_optimizations as SavedOptimizations | SavedOptimizations[] | null | undefined

    if (!saved) {
        return null
    }
    if (Array.isArray(saved)) {
        if (typeof route.using_optimization_indx === 'number' && saved[route.using_optimization_indx]) {
            return saved[route.using_optimization_indx]
        }
        return saved[0] ?? null
    }
    return saved
}

function decodePolyline(encoded: string) {
    let index = 0
    const len = encoded.length
    const path: Array<{ lat: number; lng: number }> = []
    let lat = 0
    let lng = 0

    while (index < len) {
        let result = 0
        let shift = 0
        let b
        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)
        const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1
        lat += deltaLat

        result = 0
        shift = 0
        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)
        const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1
        lng += deltaLng

        path.push({
            lat: lat / 1e5,
            lng: lng / 1e5,
        })
    }

    return path
}
