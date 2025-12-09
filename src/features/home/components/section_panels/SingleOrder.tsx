import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { ItemIcon } from '../../../../assets/icons'

import type { OrderPayload, RoutePayload } from '../../types/backend'
import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'
import { getStoredNavigationService, openNavigationForOrder, storeNavigationService, type NavigationService } from './utils/navigationHelpers'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { computeArrivalRange } from '../../utils/arrivalRange'
import { formatTimeLabel } from '../../utils/timeFormat'

interface BuildersHeaderActionsProps{
    popupManager?: ActionManager
    sectionManager?: ActionManager
    onClose?: ()=>void
}

interface BuildersInteractionActionProps{
    sectionManager: ActionManager
    popupManager?: ActionManager
    onClose?: ()=>void
    onOpenItems?: () => void
    onNavigate?: () => void
    onOpenMessages?: () => void
    orderId?: number
    routeId?: number
    chatCount?: number
}

const buildHeaderActions = ({ onClose }:BuildersHeaderActionsProps)=>{
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

const buildInteractionActions = ({ sectionManager, popupManager, onOpenItems, onNavigate, onOpenMessages, orderId, routeId, chatCount }:BuildersInteractionActionProps & { chatCount?: number })=>{
    return[
        <BasicButton children={'Items'} params={
            {
                variant:'secondary',
                className:"w-[110px]",
                onClick:()=>{ 
                    if (onOpenItems) {
                        onOpenItems()
                        return
                    }
                    sectionManager?.open({
                        key:'ItemSection',
                        parentParams:{
                            className:'w-[400px] absolute right-full top-0 z-[70] shadow-2xl',
                            label:"Items", 
                            icon:<ItemIcon className="app-icon h-4 w-4" />,
                            animation:'expand',
                        }
                    })
                }
            }
        }
        />,
        <BasicButton children={<div className="flex items-center gap-2">Chat {chatCount ? <span className="rounded-full bg-[var(--color-dark-blue)]/80 px-2 py-[2px] text-[10px] font-semibold text-[var(--color-page)]">{chatCount}</span> : null}</div>} params={
            {
                variant:'secondary',
                className:"w-[110px]",
                onClick:()=>{
                    sectionManager?.open({
                        key:'ChatSection',
                        parentParams:{
                            className:'w-[400px] absolute right-full top-0 z-[70] shadow-2xl',
                            label:"Chat", 
                            icon:<ItemIcon className="app-icon h-4 w-4" />,
                            animation:'expand',
                        }
                    })
                }
            }
        }
        />,
        
        <BasicButton children={'Edit Order'} params={{
            variant:'primary',
            className:"w-[110px]",
            onClick:()=>{ 
                if(orderId){
                    popupManager?.open({ key:'FillOrder', payload:{ mode:'edit', orderId, routeId } })
                }
            }
        }} />,
        <BasicButton children={'Message'} params={{
            variant:'secondary',
            className:"w-[110px]",
            onClick:()=>{ 
                if(onOpenMessages){
                    onOpenMessages()
                }
            }
        }} />,
        <BasicButton
          children={'Navigate'}
          params={{
            className:"w-[110px]",
            variant: 'secondary',
            onClick: onNavigate,
          }}
        />,
    ]
}


interface OrderSectionProps{
    payload?:ActionPayload
    onClose: ()=> void
}

const SingleOrder = ({
    payload,
    onClose
}:OrderSectionProps) => {

    // Use Contexts
    const {setHeaderActions, setInteractionActions} = useSectionPanel()
    const sectionManager  = useResourceManager('sectionManager')
    const routesDataManager = useResourceManager('routesDataManager')
    const popupManager = useResourceManager('popupManager')
    const { showMessage } = useMessageManager()
    const payloadRecord = payload as Record<string, unknown> | undefined
    const requestedRouteId = typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const requestedOrderId = typeof payloadRecord?.['orderId'] === 'number' ? (payloadRecord['orderId'] as number) : undefined
    const selectedRoute = routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
    const selectedOrder = routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')
    const resolvedRouteId =
        (typeof selectedOrder?.meta?.['routeId'] === 'number' ? (selectedOrder.meta?.['routeId'] as number) : undefined) ??
        (typeof selectedRoute?.id === 'number' ? (selectedRoute.id as number) : undefined) ??
        requestedRouteId
    const route =
        selectedRoute?.data ??
        (resolvedRouteId != null
            ? routesDataManager.find<RoutePayload>(resolvedRouteId, { collectionKey: 'routes', targetKey: 'id' }) ?? null
            : null)
    const resolvedOrderId = (typeof selectedOrder?.id === 'number' ? (selectedOrder.id as number) : undefined) ?? requestedOrderId
    const order =
        selectedOrder?.data ??
        (resolvedOrderId != null
            ? route?.delivery_orders?.find((entry: OrderPayload) => entry.id === resolvedOrderId) ?? null
            : null)
    const arrivalRange = useMemo(
        () => computeArrivalRange(order?.expected_arrival_time, route?.delivery_time_range ?? 30),
        [order?.expected_arrival_time, route?.delivery_time_range],
    )
    const formattedExpectedArrival = useMemo(
        () => formatTimeLabel(order?.expected_arrival_time),
        [order?.expected_arrival_time],
    )
    const callButtonRef = useRef<HTMLDivElement | null>(null)
    const callPopoverRef = useRef<HTMLDivElement | null>(null)
    const hideCallMenuTimeout = useRef<number | null>(null)
    const [callMenu, setCallMenu] = useState<{ top: number; left: number; width: number } | null>(null)
    const phoneOptions = useMemo(
        () =>
            [
                order?.client_primary_phone
                    ? { key: 'primary' as const, label: 'Primary', phone: order.client_primary_phone }
                    : null,
                order?.client_secondary_phone
                    ? { key: 'secondary' as const, label: 'Secondary', phone: order.client_secondary_phone }
                    : null,
            ].filter(Boolean) as Array<{ key: 'primary' | 'secondary'; label: string; phone: NonNullable<OrderPayload['client_primary_phone']> }>,
        [order?.client_primary_phone, order?.client_secondary_phone],
    )
    const hasMultiplePhones = phoneOptions.length > 1
    const singlePhone = !hasMultiplePhones ? phoneOptions[0]?.phone ?? null : null

    const handleNavigate = useCallback(() => {
        if (!order) {
            return
        }
        const stored = getStoredNavigationService()
        const openForService = (service: NavigationService, remember: boolean) => {
            if (remember) {
                storeNavigationService(service)
            }
            openNavigationForOrder(order, service)
        }

        if (stored) {
            openForService(stored, false)
            return
        }

        popupManager?.open({
            key: 'NavigationServicePopup',
            payload: {
                current: stored ?? undefined,
                onSelect: (service: NavigationService, remember: boolean) => openForService(service, remember),
            },
        })
    }, [order, popupManager])

    const openMessagesPopup = useCallback(() => {
        if (!order) {
            showMessage({ status: 400, message: 'Select an order before sending messages.' })
            return
        }
        popupManager?.open({
            key: 'SendMessages',
            payload: {
                targets: [order],
                arrival_time_range: route?.arrival_time_range ?? 30,
            },
        })
    }, [order, popupManager, route?.arrival_time_range, showMessage])

    const clearHideCallMenuTimeout = useCallback(() => {
        if (hideCallMenuTimeout.current != null) {
            window.clearTimeout(hideCallMenuTimeout.current)
            hideCallMenuTimeout.current = null
        }
    }, [])

    const computeCallMenuPosition = useCallback(() => {
        if (!callButtonRef.current) return null
        const rect = callButtonRef.current.getBoundingClientRect()
        const width = 220
        const estimatedHeight = 120
        let left = rect.left + rect.width / 2 - width / 2
        left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
        let top = rect.bottom + 8
        if (top + estimatedHeight > window.innerHeight - 8) {
            top = rect.top - estimatedHeight - 8
        }
        return { top, left, width }
    }, [])

    const openCallMenu = useCallback(() => {
        if (!hasMultiplePhones) return
        const pos = computeCallMenuPosition()
        if (pos) {
            setCallMenu(pos)
        }
    }, [computeCallMenuPosition, hasMultiplePhones])

    const scheduleCloseCallMenu = useCallback(() => {
        clearHideCallMenuTimeout()
        hideCallMenuTimeout.current = window.setTimeout(() => setCallMenu(null), 140)
    }, [clearHideCallMenuTimeout])

    const handleCallNumber = useCallback((phone?: OrderPayload['client_primary_phone'] | null) => {
        if (!phone) return
        clearHideCallMenuTimeout()
        setCallMenu(null)
        const tel = buildTelHref(phone)
        window.location.href = tel
    }, [])

    const handleCallClick = useCallback(() => {
        if (!order) return
        if (hasMultiplePhones) {
            openCallMenu()
            return
        }
        if (singlePhone) {
            handleCallNumber(singlePhone)
        }
    }, [handleCallNumber, hasMultiplePhones, openCallMenu, order, singlePhone])
    

    // ____________________________________________________________________________________________________________


    // useEffects 
    const openItemsSection = useCallback(() => {
        if (!order) {
            return
        }
        routesDataManager.setActiveSelection('SelectedOrder', {
            id: order.id,
            data: order,
            meta: { routeId: route?.id ?? order.route_id ?? null }
        })
        sectionManager.open({
            key:'ItemSection',
            parentParams:{
                className:'w-[400px] absolute z-3 right-[100%]',
                label:"Items", 
                icon:<ItemIcon className="app-icon h-4 w-4" />,
                animation:'expand'
            }
        })
    }, [order, route?.id, routesDataManager, sectionManager])

    useEffect(()=>{

        if(setHeaderActions){
            setHeaderActions( buildHeaderActions( { onClose } ) )
        }
        if( setInteractionActions ){
            const callButton = (
                <div
                    ref={callButtonRef}
                    className="relative"
                    onMouseEnter={() => {
                        if (hasMultiplePhones) {
                            clearHideCallMenuTimeout()
                            openCallMenu()
                        }
                    }}
                    onMouseLeave={() => {
                        if (hasMultiplePhones) {
                            scheduleCloseCallMenu()
                        }
                    }}
                >
                    <BasicButton
                        children={'Call'}
                        params={{
                            className: 'w-[110px]',
                            variant: 'secondary',
                            onClick: handleCallClick,
                        }}
                    />
                </div>
            )
            setInteractionActions([
                ...buildInteractionActions({
                    sectionManager,
                    popupManager,
                    onClose,
                    onOpenItems: openItemsSection,
                    onNavigate: handleNavigate,
                    onOpenMessages: openMessagesPopup,
                    orderId: order?.id,
                    routeId: route?.id ?? order?.route_id,
                    chatCount: order?.notes_chat?.length
                }),
                callButton,
            ])
        }
        
        
        },[
            clearHideCallMenuTimeout,
            handleCallClick,
            handleNavigate,
            hasMultiplePhones,
            onClose,
            openCallMenu,
            openItemsSection,
            openMessagesPopup,
            order?.id,
            order?.route_id,
            popupManager,
            route?.id,
            scheduleCloseCallMenu,
            sectionManager,
            setHeaderActions,
            setInteractionActions,
        ])

    useEffect(() => () => clearHideCallMenuTimeout(), [clearHideCallMenuTimeout])

    useEffect(() => {
        if (!callMenu) return
        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node | null
            if (!target) return
            if (callPopoverRef.current?.contains(target)) return
            if (callButtonRef.current?.contains(target)) return
            setCallMenu(null)
        }
        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('touchstart', handlePointerDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('touchstart', handlePointerDown)
        }
    }, [callMenu])

    useEffect(() => {
        if (!hasMultiplePhones && callMenu) {
            setCallMenu(null)
        }
    }, [callMenu, hasMultiplePhones])
    // ____________________________________________________________________________________________________________

    if (!route || !order) {
        return <p className="text-sm text-gray-500">Order not found.</p>
    }
    console.log(order)

    return ( 
        <>
            <div className="space-y-6 text-[0.9em] py-4">
                <section className="space-y-3">
                    {/* Client Information */}
                        <div className="pb-2">
                            <h3 className="text-sm font-semibold text-gray-500 mb-3">Client Information</h3>
                            <div className="space-y-3">
                            <div>
                                <p className="font-semibold text-gray-600 text-[11px]">Client Name</p>
                                <p className="font-[550]">{order.client_first_name} {order.client_last_name}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-600 text-[11px]">Client Address</p>
                                <p className="font-[550]">{buildAddressLabel(order)}</p>
                            </div>
                            <div>
                                <p className="mt-1 font-semibold text-gray-600 text-[11px]">Client Email</p>
                                <p className="font-[550] break-all">{order.client_email || '-'}</p>
                            </div>
                            <div>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="font-semibold text-gray-600 text-[11px]">Primary Phone</p>
                                         <p className="font-[550]">
                                            {order.client_primary_phone?.prefix ?? ''} {order.client_primary_phone?.number ?? ''}
                                        </p>
                                    </div>
                                    
                                   
                                    {order.client_secondary_phone?.number ? (
                                        <div>
                                            <p className="font-semibold text-gray-600 text-[11px]">Secondary Phone</p>
                                            <p className="font-[550]">
                                                {order.client_secondary_phone?.prefix ?? ''} {order.client_secondary_phone?.number ?? ''}
                                            </p>
                                        </div>
                                    ) : null}

                                </div>

                            </div>
                             
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Delivery Information */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3">Delivery Information</h3>
                            <div className="space-y-3">
                            <div>
                                <p className="font-semibold text-gray-600 text-[11px]">Expected Arrival</p>
                                <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-gray-800">
                                    <span>{formattedExpectedArrival ?? '-'}</span>
                                    {arrivalRange ? (
                                        <span className="text-[12px] font-medium text-gray-600">({arrivalRange})</span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                <p className="font-semibold text-gray-600 text-[11px]">Deliver After</p>
                                <p className="font-[550]">{order.delivery_after || "-"}</p>
                                </div>
                                <div>
                                <p className="font-semibold text-gray-600 text-[11px]">Deliver Before</p>
                                <p className="font-[550]">{order.delivery_before || "-"}</p>
                                </div>
                            </div>

                            {order.client_language && (
                                <div>
                                <p className="font-semibold text-gray-800 mb-1">Language</p>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold uppercase">
                                    {order.client_language}
                                </span>
                                </div>
                            )}
                            </div>
                        </div>
                </section>

                
            </div>
            {callMenu && hasMultiplePhones ? (
                <div
                    ref={callPopoverRef}
                    className="fixed z-[120] rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-2xl"
                    style={{ top: callMenu.top, left: callMenu.left, width: callMenu.width }}
                    onMouseEnter={clearHideCallMenuTimeout}
                    onMouseLeave={scheduleCloseCallMenu}
                >
                    {/* <p className="text-[11px]  font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)] mb-2">Call with</p> */}
                    <div className="space-y-1">
                        {phoneOptions.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-[var(--color-page)]"
                                onClick={() => handleCallNumber(option.phone)}
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                                    {option.label}
                                </p>
                                <p className="text-sm font-semibold text-[var(--color-text)]">{formatPhoneDisplay(option.phone)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
     )
}
 
export default SingleOrder;

function buildAddressLabel(order: OrderPayload): string {
    const address = order.client_address
    if (!address) {
        return 'No address'
    }
    const parts = [address.city, address.postalCode ?? address.postal_code].filter(Boolean)
    return parts.join(', ')
}

function formatPhoneDisplay(phone?: { prefix?: string | null; number?: string | null } | null) {
    if (!phone) return ''
    const prefix = phone.prefix ?? ''
    const number = phone.number ?? ''
    return [prefix, number].filter(Boolean).join(' ')
}

function buildTelHref(phone: { prefix?: string | null; number?: string | null }) {
    const raw = `${phone.prefix ?? ''}${phone.number ?? ''}`
    const normalized = raw.replace(/[^\d+]/g, '')
    return `tel:${normalized}`
}
