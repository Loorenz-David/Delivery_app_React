import type { ComponentType, ReactNode } from 'react'
import { useEffect, useMemo } from 'react'

import { DndContext, DragOverlay, closestCenter, pointerWithin } from '@dnd-kit/core'


import { usePlanOrderDndController } from '@/featuresV2/plan/hooks/usePlanOrderDndController'
import type { StackComponentProps } from '@/shared/stack-manager/types'

import { ResourcesManagerProvider } from '@/shared/resource-manager/ResourceManagerContext'

import { useStackActionEntries } from '@/shared/stack-manager/useStackActionEntries'
import { StackActionManager } from '@/shared/stack-manager/StackActionManager'

import { useMap } from '@/shared/map'


import { SectionPanel } from '@/shared/section-panel/SectionPanel'
import { MainPopup } from '@/shared/popups/MainPopup/MainPopup'

import { OrderCard } from '@/featuresV2/order/components/OrderCard'
import { RouteStopDragOverlay } from '@/featuresV2/plan/planTypes/localDelivery/components/RouteStopDragOverlay'

import type{ PayloadBase } from '../types/types'
import { useBaseControlls } from '../hooks/useBaseControlls'
import { homePopupRegistry } from '../registry/homePopups'
import { homeSectionRegistry } from '../registry/homeSections'
import { LoadingPopup } from '@/shared/popups/loadingPopup/loadingPopup'
import { useMobile } from '@/app/contexts/MobileContext'

const collisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
        return pointerCollisions
    }

    return closestCenter(args)
}



type ExtractPayload<T> = T extends ComponentType<StackComponentProps<infer P>>
  ? P
  : never

type HomePopupPayloads = {
  [K in keyof typeof homePopupRegistry]: ExtractPayload<(typeof homePopupRegistry)[K]>
}

type ManagerContextProps = {
    children: ReactNode

}

export function HomeManagersProvider({children}: ManagerContextProps) {
    const {isMobile} = useMobile()

    const popupManager = useMemo(
        () =>
        new StackActionManager<HomePopupPayloads>({
            blueprint: MainPopup,
            stackRegistry: homePopupRegistry,
        }),
        [],
    )
  
    const sectionManager = useMemo(
        () =>
        new StackActionManager({
            blueprint: SectionPanel,
            stackRegistry: homeSectionRegistry,
        }),
        [],
    )

    const mapManager = useMap()

    const baseControlls = useBaseControlls<PayloadBase>()

    useStackActionEntries(popupManager)
    useStackActionEntries(sectionManager)

    const hanldeKeyDown = (event:KeyboardEvent)=>{

        if(popupManager.getOpenCount() > 0 ) return

        sectionManager.closeLastOnEsc(event)
    }

    useEffect(()=>{
        if(!isMobile){
            window.addEventListener('keydown', hanldeKeyDown)
        }
        return () => {
            window.removeEventListener('keydown', hanldeKeyDown)
        }
    },[isMobile])

    const { onDragStart, onDragOver, onDragEnd, onDragCancel, activeDrag, droppedInPlan, sensors }  = usePlanOrderDndController()

    return (
       <ResourcesManagerProvider managers={{ sectionManager, mapManager, popupManager, baseControlls, droppedInPlan }}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                autoScroll={{
                    enabled: true,
                    threshold: { x: 0.1, y: 0.2 },
                    acceleration: 12,
                    interval: 8,
                }}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
            >
                {children}

                <DragOverlay>
                    {activeDrag?.type === 'route_stop' ? (
                        <div className="pointer-events-none cursor-grabbing">
                            <RouteStopDragOverlay
                                routeStopClientId={activeDrag.routeStopClientId}
                                order={activeDrag.order}
                                stop={activeDrag.stop}
                                planStartDate={activeDrag.planStartDate}
                            />
                        </div>
                    ) : activeDrag?.type === 'order' ? (
                        <div className="pointer-events-none cursor-grabbing">
                            <OrderCard order={activeDrag.order} />
                        </div>
                    ) : null}
                </DragOverlay>

            </DndContext>
       </ResourcesManagerProvider>
    )

}
