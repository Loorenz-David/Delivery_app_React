import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useHomeStore } from '../../../../store/home/useHomeStore'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { ItemIcon, MessageIcon, SettingIcon,  LocationIcon } from '../../../../assets/icons'

import type { OrderPayload } from '../../types/backend'
import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'
import { getStoredNavigationService, openNavigationForOrder, storeNavigationService, type NavigationService } from './utils/navigationHelpers'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { computeArrivalRange } from '../../utils/arrivalRange'
import { formatTimeLabel } from '../../utils/timeFormat'
import { useMobileSectionHeader, type MobileHeaderAction } from '../../contexts/MobileSectionHeaderContext'

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
    isMobile?: boolean
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

const buildInteractionActions = ({
    sectionManager,
    popupManager,
    onOpenItems,
    onNavigate,
    onOpenMessages,
    orderId,
    routeId,
    chatCount,
    isMobile,
}: BuildersInteractionActionProps & { chatCount?: number })=>{
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
        
        <BasicButton children={'Message'} params={{
            variant:'secondary',
            className:"w-[110px]",
            onClick:()=>{ 
                if(onOpenMessages){
                    onOpenMessages()
                }
            }
        }} />,
        <BasicButton children={'Edit Order'} params={{
            variant:'primary',
            className:"w-[110px]",
            onClick:()=>{ 
                if(orderId){
                    popupManager?.open({ key:'FillOrder', payload:{ mode:'edit', orderId, routeId } })
                }
            }
        }} />,
        <BasicButton children={<div className="flex items-center gap-2">Chat {chatCount ? <span className="rounded-full bg-[var(--color-dark-blue)]/80 px-2 py-[2px] text-[10px] font-semibold text-[var(--color-page)]">{chatCount}</span> : null}</div>} params={
            {
                variant:'secondary',
                className:"w-[110px]",
                onClick:()=>{
                    sectionManager?.open({
                        key:'ChatSection',
                        parentParams:{
                            className: isMobile ? 'w-full h-full z-[5] absolute' : 'w-[400px] absolute right-full top-0 z-[70] shadow-2xl',
                            label:"Chat", 
                            icon:<ItemIcon className="app-icon h-4 w-4" />,
                            animation:'expand',
                        }
                    })
                }
            }
        }
        />,
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
    const popupManager = useResourceManager('popupManager')
    const isMobile = useResourceManager('isMobileObject')
    const mobileHeader = useMobileSectionHeader()
    const registerHeader = mobileHeader?.registerHeader
    const updateHeader = mobileHeader?.updateHeader
    const removeHeader = mobileHeader?.removeHeader
    const mobileHeaderIdRef = useRef<string | null>(null)
    const lastHeaderStateRef = useRef<{ title: string; routeKey: string | null; orderKey: string | null } | null>(null)
    const { showMessage } = useMessageManager()
    const selectedRouteId = useHomeStore((state) => state.selectedRouteId)
    const selectedOrderId = useHomeStore((state) => state.selectedOrderId)
    const route = useHomeStore((state) =>
      selectedRouteId != null ? state.routes.find((r) => r.id === selectedRouteId) ?? null : null,
    )
    const { findOrderById, selectOrder } = useHomeStore.getState()
    const payloadRecord = payload as Record<string, unknown> | undefined
    const requestedRouteId = typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const requestedOrderId = typeof payloadRecord?.['orderId'] === 'number' ? (payloadRecord['orderId'] as number) : undefined
    const resolvedRouteId = selectedRouteId ?? requestedRouteId ?? route?.id ?? null
    const resolvedOrderId = selectedOrderId ?? requestedOrderId ?? null
    const order =
        resolvedOrderId != null
            ? findOrderById(resolvedOrderId, resolvedRouteId) ??
              route?.delivery_orders?.find((entry: OrderPayload) => entry.id === resolvedOrderId) ??
              null
            : null
    const arrivalRange = useMemo(
        () => computeArrivalRange(order?.expected_arrival_time, route?.delivery_time_range ?? 30),
        [order?.expected_arrival_time, route?.delivery_time_range],
    )
    const formattedExpectedArrival = useMemo(
        () => formatTimeLabel(order?.expected_arrival_time),
        [order?.expected_arrival_time],
    )
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

    const handleCall = useCallback(
        (phone?: OrderPayload['client_primary_phone'] | null) => {
            if (!phone) {
                showMessage({ status: 'warning', message: 'No phone number available.' })
                return
            }
            window.location.href = buildTelHref(phone)
        },
        [showMessage],
    )

    // ____________________________________________________________________________________________________________


    // useEffects 
    const openItemsSection = useCallback(() => {
        if (!order) {
            return
        }
        selectOrder(order.id, { routeId: route?.id ?? order.route_id ?? null })
        sectionManager.open({
            key:'ItemSection',
            parentParams:{
                className:isMobile.isMobile ? 'w-full h-screen z-[5] absolute' : 'w-[400px] absolute z-3 right-[100%]',
                label:"Items", 
                icon:<ItemIcon className="app-icon h-4 w-4" />,
                animation:'expand'
            }
        })
    }, [order, route?.id, sectionManager, selectOrder])

    useEffect(()=>{

        if(!setHeaderActions || !setInteractionActions){
            return
        }
        if(isMobile?.isMobile){
            setHeaderActions([])
            setInteractionActions([])
            return
        }
        setHeaderActions( buildHeaderActions( { onClose } ) )
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
                chatCount: order?.notes_chat?.length,
                isMobile: isMobile.isMobile,
            }),
        ])
    },[
        handleNavigate,
        onClose,
        openItemsSection,
        openMessagesPopup,
        order?.id,
        order?.route_id,
        popupManager,
        route?.id,
        sectionManager,
        setHeaderActions,
        setInteractionActions,
        isMobile?.isMobile,
    ])

    useEffect(() => {
        if (!removeHeader) {
            return
        }
        return () => {
            if (mobileHeaderIdRef.current) {
                removeHeader(mobileHeaderIdRef.current)
                mobileHeaderIdRef.current = null
                lastHeaderStateRef.current = null
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
                lastHeaderStateRef.current = null
            }
            return
        }

        const title = order ? `${order.client_first_name ?? 'Order'} ${order.client_last_name ?? ''}`.trim() || 'Order details' : 'Order details'
        const secondaryContent = order ? (
            <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-[var(--color-text)]">Order #{order.id}</span>
                <span className="text-xs text-[var(--color-muted)]">
                    {route?.route_label ?? `Route ${route?.id ?? ''}`}
                </span>
            </div>
        ) : (
            <span className="text-sm text-[var(--color-muted)]">Select an order to view details.</span>
        )

        const menuActions: MobileHeaderAction[] = [
            {
                label: 'Items',
                icon: <ItemIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openItemsSection,
            },
            {
                label: 'Chat',
                icon: <MessageIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: () => {
                    sectionManager?.open({
                        key:'ChatSection',
                        parentParams:{
                            className: isMobile?.isMobile ? 'w-full h-screen z-[5] absolute' : 'w-[400px] absolute right-full top-0 z-[70] shadow-2xl',
                            label:"Chat", 
                            icon:<ItemIcon className="app-icon h-4 w-4" />,
                            animation:'expand',
                        }
                    })
                },
            },
            {
                label: 'Edit Order',
                icon: <SettingIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: () => {
                    if(order?.id){
                        popupManager?.open({ key:'FillOrder', payload:{ mode:'edit', orderId: order.id, routeId: route?.id ?? order.route_id } })
                    }
                },
            },
            {
                label: 'Message',
                icon: <MessageIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: openMessagesPopup,
            },
            {
                label: 'Navigate',
                icon: <LocationIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: handleNavigate,
            },
        ]

        const nextState = {
            title,
            routeKey: route ? `${route.id}` : 'no-route',
            orderKey: order ? `${order.id}` : 'no-order',
        }
        const prevState = lastHeaderStateRef.current

        if (!mobileHeaderIdRef.current) {
            mobileHeaderIdRef.current = registerHeader({
                title,
                onBack: onClose,
                menuActions,
                secondaryContent,
            })
            lastHeaderStateRef.current = nextState
        } else {
            const changed =
                !prevState ||
                prevState.title !== nextState.title ||
                prevState.routeKey !== nextState.routeKey ||
                prevState.orderKey !== nextState.orderKey

            if (changed) {
                updateHeader(mobileHeaderIdRef.current, {
                    title,
                    onBack: onClose,
                    menuActions,
                    secondaryContent,
                })
                lastHeaderStateRef.current = nextState
            }
        }
    }, [
        handleNavigate,
        isMobile?.isMobile,
        onClose,
        openItemsSection,
        openMessagesPopup,
        order,
        popupManager,
        registerHeader,
        removeHeader,
        route,
        sectionManager,
        updateHeader,
    ])
    // ____________________________________________________________________________________________________________

    if (!route || !order) {
        return <p className="text-sm text-gray-500">Order not found.</p>
    }
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
                                        <BasicButton
                                          params={{
                                            variant: 'ghost',
                                            className: 'p-0 h-auto text-[var(--color-primary)] font-[550] hover:underline',
                                            onClick: () => handleCall(order.client_primary_phone),
                                          }}
                                        >
                                          {formatPhoneDisplay(order.client_primary_phone) || '-'}
                                        </BasicButton>
                                    </div>
                                    
                                   
                                    {order.client_secondary_phone?.number ? (
                                        <div>
                                            <p className="font-semibold text-gray-600 text-[11px]">Secondary Phone</p>
                                            <BasicButton
                                              params={{
                                                variant: 'ghost',
                                                className: 'p-0 h-auto text-[var(--color-primary)] font-[550] hover:underline',
                                                onClick: () => handleCall(order.client_secondary_phone),
                                              }}
                                            >
                                              {formatPhoneDisplay(order.client_secondary_phone)}
                                            </BasicButton>
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
