import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'
import type { ActiveSelection } from '../../../../resources_manager/managers/DataManager'
import { useOrderDragAndDrop } from '../../hooks/useOrderDragAndDrop'
import { useItemActions } from '../../hooks/useItemActions'


import { BasicButton } from '../../../../components/buttons/BasicButton'
import { OrderCard} from '../section_cards/OrderCard'


import type{ RoutePayload, OrderPayload, SavedOptimizations } from '../../types/backend'
import { UpdateOrderService } from '../../api/deliveryService'
import type { OrderMarkerDescriptor, PolylineDescriptor } from '../../../../google_maps/MapManager'
import { SingleOrderIcon, ThunderIcon, StatsIcon } from '../../../../assets/icons'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import type { MessagePayload } from '../../../../message_manager/MessageManagerContext'


interface BuildersProps{
    popupManager: ActionManager
    sectionManager?: ActionManager
    onClose?: ()=>void
    routeId?:number
    route?: RoutePayload | null
    showMessage?: (payload: MessagePayload) => void
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
const buildInteractionActions = ({ popupManager, sectionManager, routeId, route, showMessage }:BuildersProps)=>{
    const openOptimizationSection = () => {
        if (!sectionManager) {
            return
        }
        const hadExisting = sectionManager.closeByKey(['RouteOptimizationSection'])
        const openSection = () => {
            sectionManager.open({
                key: 'RouteOptimizationSection',
                payload: { routeId },
                parentParams: {
                    className: 'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
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
    }
    return[
         <BasicButton
            children={'Route Stats'}
            params={{
            variant:'secondary',
            onClick: () => {
                if (!sectionManager) {
                    return
                }
                const hadExisting = sectionManager.closeByKey(['RouteStatsSection'])
                const openSection = () =>
                    sectionManager.open({
                        key: 'RouteStatsSection',
                        parentParams: {
                            className: 'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
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
            }
            }}
        />,
        <BasicButton
            children={'Edit Route'}
            params={{
            variant:'secondary',
            onClick:()=>{popupManager.open({key:'FillRoute', payload:{mode:'edit',routeId}})}
            }}
        />,
        <BasicButton
            children={'+ Order'}
            params={{
            className:"w-[150px]",
            variant:'primary',
            onClick:()=>{popupManager.open({key:'FillOrder', payload:{mode:'create', routeId}})}
            }}
        />,
        <BasicButton
            children={'Send Messages'}
            params={{
                variant:'secondary',
                className:"w-[130px]",
                onClick:()=> {
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
                }
            }}
        />,
        
        <BasicButton
            children={'Optimization'}
            params={{
            variant:'secondary',
            onClick: openOptimizationSection
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
    const routesDataManager = useResourceManager('routesDataManager')
    const { showMessage } = useMessageManager()
    const routesSnapshot = useDataManager(routesDataManager)
    const mapManager = useResourceManager('mapManager')
    const selectedRouteSelection =
        (routesSnapshot.activeSelections?.['SelectedRoute'] as ActiveSelection<RoutePayload> | undefined) ??
        routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
    const selectedOrderSelection =
        (routesSnapshot.activeSelections?.['SelectedOrder'] as ActiveSelection<OrderPayload> | undefined) ??
        routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')
    const route:RoutePayload | undefined = selectedRouteSelection?.data
    const routeId = route?.id
    const rawOrders = route?.delivery_orders ?? []
    const optimization = useMemo(() => (route ? resolveOptimization(route) : null), [route])
    const skippedShipmentIds = useMemo(
        () => optimization?.skipped_shipments?.map((entry) => entry.order_id) ?? [],
        [optimization],
    )
    const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
    const { handleItemAction } = useItemActions({ route, routeId })

    const initialCleanupRef = useRef(true)
    // ____________________________________________________________________________________________________________


        
    
    // helper functions 

    const handleClose = useCallback(() => {
        routesDataManager.removeActiveSelection('SelectedRoute')
        onClose()
    }, [onClose, routesDataManager])


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

            routesDataManager.updateDataset((dataset) => {
                if (!dataset) {
                    return dataset
                }
                const nextRoutes = dataset.routes.map((entry) =>
                    entry.id === route.id
                        ? {
                              ...entry,
                              delivery_orders: normalizedOrders,
                          }
                        : entry,
                )
                return {
                    ...dataset,
                    routes: nextRoutes,
                }
            })
            
            routesDataManager.setActiveSelection('SelectedRoute', {
                id: route.id,
                data: {
                    ...route,
                    delivery_orders: normalizedOrders,
                },
            })

            const selectedOrder = routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')
            const selectedOrderId =
                typeof selectedOrder?.id === 'number' ? (selectedOrder.id as number) : null
            if (selectedOrderId != null) {
                const updatedOrder = normalizedOrders.find((order) => order.id === selectedOrderId) ?? null
                routesDataManager.setActiveSelection('SelectedOrder', {
                    id: selectedOrderId,
                    data: updatedOrder,
                    meta: {
                        routeId: route.id,
                        ...selectedOrder?.meta,
                    },
                })
            }
            if (meta?.movedOrderId != null) {
                const updatedOrder = normalizedOrders.find((order) => order.id === meta.movedOrderId)
                if (updatedOrder) {
                    sendArrangementUpdate(updatedOrder.id, updatedOrder.delivery_arrangement ?? 0)
                }
            }
        },
        [route, routesDataManager, sendArrangementUpdate],
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
        const orderMatch = rawOrders.find((entry) => entry.id === orderId) ?? null
        routesDataManager.setActiveSelection('SelectedOrder', {
            id: orderId,
            data: orderMatch,
            meta: { routeId: route?.id ?? null }
        })
        mapManager.highlightMarker(orderId)
        const hadExisting = sectionManager.closeByKey(['SingleOrder'])
        const openSingleOrder = () => {
            
            sectionManager.open({
            key:'SingleOrder',
            parentParams:{
                className:'w-[400px] absolute right-full top-0 z-3 shadow-2xl',
                label:"Order details", 
                icon:<SingleOrderIcon className="app-icon h-4 w-4" />,
                animation:'expand',
                }
            })
        }
        if (hadExisting) {
            setTimeout(openSingleOrder, 0)
        } else {
            openSingleOrder()
        }
        }, [mapManager, rawOrders, routesDataManager, route?.id, sectionManager])
    // ____________________________________________________________________________________________________________


    useEffect(() => {
        return () => {
            if (initialCleanupRef.current) {
                initialCleanupRef.current = false
                return
            }
            routesDataManager.removeActiveSelection('SelectedRoute')
        }
    }, [routesDataManager])

    // useEffects 
    useEffect(()=>{

        if(setHeaderActions){
            setHeaderActions( buildHeaderActions( { popupManager, onClose: handleClose } ) )
        }
        if( setInteractionActions ){
            setInteractionActions( buildInteractionActions( { popupManager, sectionManager, routeId, route: route ?? null, showMessage} ) )
        }
        
        
    },[handleClose, popupManager, route, routeId, sectionManager, setHeaderActions, setInteractionActions, showMessage])

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
                status: 'delivered' as const,
            })
        }
        markers.push(
            ...rawOrders.flatMap((order, index) => {
            const coords = order.client_address?.coordinates
            if (!coords) {
                return []
            }
            const label =
                order.delivery_arrangement != null ? String(order.delivery_arrangement + 1) : String(index + 1)
            return [
                {
                    id: order.id,
                    position: coords,
                    label,
                    status: 'pending' as const,
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
                status: 'failed' as const,
            })
        }
        mapManager.syncMarkers(markers)
        if (selectedOrderSelection?.id) {
            mapManager.highlightMarker(selectedOrderSelection.id)
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

        return () => {
            mapManager.clearMarkers()
            mapManager.clearPolylines()
        }
    }, [buildSectionSingleOrder, mapManager, optimization, rawOrders, route, selectedOrderSelection?.id])
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
