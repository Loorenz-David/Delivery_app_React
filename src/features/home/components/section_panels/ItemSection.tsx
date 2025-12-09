import { useCallback, useEffect } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { OrderPayload, RoutePayload, ItemPayload } from '../../types/backend'

import type { ActionManager, ActionPayload } from '../../../../resources_manager/managers/ActionManager'

import { ItemCard } from '../section_cards/ItemCard.tsx'
import { useItemActions } from '../../hooks/useItemActions'


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
    const routesDataManager = useResourceManager('routesDataManager')
    const payloadRecord = payload as Record<string, unknown> | undefined
    const payloadRouteId = typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const payloadOrderId = typeof payloadRecord?.['orderId'] === 'number' ? (payloadRecord['orderId'] as number) : undefined

    const selectedRoute = routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
    const selectedOrder = routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')

    const resolvedRouteId =
        (typeof selectedOrder?.meta?.['routeId'] === 'number' ? (selectedOrder.meta?.['routeId'] as number) : undefined) ??
        (typeof selectedRoute?.id === 'number' ? (selectedRoute.id as number) : undefined) ??
        payloadRouteId
    const route =
        selectedRoute?.data ??
        (resolvedRouteId != null
            ? routesDataManager.find<RoutePayload>(resolvedRouteId, { collectionKey: 'routes', targetKey: 'id' }) ?? null
            : null)

    const resolvedOrderId = (typeof selectedOrder?.id === 'number' ? (selectedOrder.id as number) : undefined) ?? payloadOrderId
    const order =
        selectedOrder?.data ??
        (resolvedOrderId != null
            ? route?.delivery_orders?.find((entry: OrderPayload) => entry.id === resolvedOrderId) ?? null
            : null)
    const items = order?.delivery_items ?? []
    
    const { handleItemAction } = useItemActions({ route, routeId: resolvedRouteId })

    const handleInlineItemAction = useCallback(
        (action: string, itemId: number, data?: unknown) => handleItemAction(order ?? null, action, itemId, data),
        [handleItemAction, order],
    )

    // ____________________________________________________________________________________________________________


    // useEffects 
    useEffect(()=>{

        if(setHeaderActions){
            setHeaderActions( buildHeaderActions( { popupManager, onClose } ) )
        }
        if( setInteractionActions ){
            setInteractionActions( buildInteractionActions() )
        }
        
        
    },[popupManager, onClose, setHeaderActions, setInteractionActions])

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
