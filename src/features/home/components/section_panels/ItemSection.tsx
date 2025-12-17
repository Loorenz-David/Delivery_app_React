import { useCallback, useEffect, useRef } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext.tsx'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useHomeStore } from '../../../../store/home/useHomeStore'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { OrderPayload, ItemPayload } from '../../types/backend'

import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'

import { ItemCard } from '../section_cards/ItemCard.tsx'
import { useItemActions } from '../../hooks/useItemActions'
import { useMobileSectionHeader } from '../../contexts/MobileSectionHeaderContext'
import { CloseIcon } from '../../../../assets/icons'


interface BuildersProps{
    popupManager?: ActionManager
    onClose?: ()=>void
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

const buildInteractionActions = ()=>{
    return[
       
    ]
}


interface ItenOrderSectionProps{
    payload?:ActionPayload
    onClose: ()=> void
}

const ItemSection = ({
    payload,
    onClose
}:ItenOrderSectionProps) => {
    // Use Contexts
    const {setHeaderActions, setInteractionActions} = useSectionPanel()
    const popupManager  = useResourceManager('popupManager')
    const isMobile = useResourceManager('isMobileObject')
    const mobileHeader = useMobileSectionHeader()
    const registerHeader = mobileHeader?.registerHeader
    const updateHeader = mobileHeader?.updateHeader
    const removeHeader = mobileHeader?.removeHeader
    const mobileHeaderIdRef = useRef<string | null>(null)
    const lastHeaderStateRef = useRef<{ title: string; items: number; orderKey: string | null } | null>(null)
    const selectedRouteId = useHomeStore((state) => state.selectedRouteId)
    const selectedOrderId = useHomeStore((state) => state.selectedOrderId)
    const { findRouteById, findOrderById } = useHomeStore.getState()
    const payloadRecord = payload as Record<string, unknown> | undefined
    const payloadRouteId = typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const payloadOrderId = typeof payloadRecord?.['orderId'] === 'number' ? (payloadRecord['orderId'] as number) : undefined

    const resolvedRouteId = selectedRouteId ?? payloadRouteId ?? null
    const route = resolvedRouteId != null ? findRouteById(resolvedRouteId) : null

    const resolvedOrderId = selectedOrderId ?? payloadOrderId ?? null
    const order =
        resolvedOrderId != null
            ? findOrderById(resolvedOrderId, resolvedRouteId) ??
              route?.delivery_orders?.find((entry: OrderPayload) => entry.id === resolvedOrderId) ??
              null
            : null
    const items = order?.delivery_items ?? []
    
    const { handleItemAction } = useItemActions({ route, routeId: resolvedRouteId })

    const handleInlineItemAction = useCallback(
        (action: string, itemId: number, data?: unknown) => handleItemAction(order ?? null, action, itemId, data),
        [handleItemAction, order],
    )

    // ____________________________________________________________________________________________________________


    // useEffects 
    useEffect(()=>{

        if(!setHeaderActions || !setInteractionActions){
            return
        }
        if(isMobile?.isMobile){
            setHeaderActions([])
            setInteractionActions(buildInteractionActions())
            return
        }
        setHeaderActions( buildHeaderActions( { popupManager, onClose } ) )
        setInteractionActions( buildInteractionActions() )
        
        
    },[isMobile?.isMobile, popupManager, onClose, setHeaderActions, setInteractionActions])

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

        const headerTitle = route ? `Items` : 'Items'
        const secondaryContent = order ? (
            <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-[var(--color-text)]">
                    Order #{order.id}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{items.length} items</span>
            </div>
        ) : (
            <span className="text-sm text-[var(--color-muted)]">Select an order to view items.</span>
        )

        const menuActions = [
            {
                label: 'Close',
                icon: <CloseIcon className="app-icon h-5 w-5 text-[var(--color-text)]" />,
                onClick: onClose,
            },
        ]

        const nextState = {
            title: headerTitle,
            items: items.length,
            orderKey: order ? `${order.id}-${route?.id ?? ''}` : 'no-order',
        }
        const prevState = lastHeaderStateRef.current

        if (!mobileHeaderIdRef.current) {
            mobileHeaderIdRef.current = registerHeader({
                title: headerTitle,
                onBack: onClose,
                menuActions,
                secondaryContent,
            })
            lastHeaderStateRef.current = nextState
        } else {
            const changed =
                !prevState ||
                prevState.title !== nextState.title ||
                prevState.items !== nextState.items ||
                prevState.orderKey !== nextState.orderKey

            if (changed) {
                updateHeader(mobileHeaderIdRef.current, {
                    title: headerTitle,
                    onBack: onClose,
                    menuActions,
                    secondaryContent,
                })
                lastHeaderStateRef.current = nextState
            }
        }
    }, [items.length, isMobile?.isMobile, onClose, order, registerHeader, removeHeader, route, updateHeader])

    if (!route || !order) {
        return <p className="text-sm text-gray-500">Order not found.</p>
    }

    return ( 
        <div className="py-4 flex flex-col h-full gap-3">
            {items.map((item: ItemPayload, i: number)=>(
                <ItemCard
                    key={`Item_${i}`}
                    item={{...item}}
                    onAction={handleInlineItemAction}
                />
            ))}
            
        </div>
     )
}
 


export default ItemSection;
