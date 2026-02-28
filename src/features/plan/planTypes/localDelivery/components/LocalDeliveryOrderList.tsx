import { useMemo } from 'react'
import { useDndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { LocalDeliveryOrderCard } from './cards/LocalDeliveryOrderCard'
import { DraggableLocalDeliveryOrderCard } from './cards/DraggableLocalDeliveryOrderCard'
import { LocalDeliveryBoundaryLocationCard } from './cards/LocalDeliveryBoundaryLocationCard'
import { useLocalDeliveryContext } from '../context/useLocalDeliveryContext'
import { useLocalDeliveryStopOrdering } from '../hooks/useLocalDeliveryStopOrdering'
import { formatRouteTime } from '@/features/plan/planTypes/localDelivery/utils/formatRouteTime'
import { BasicButton } from '@/shared/buttons'
import type { useLocalDeliveryHeaderAction } from '../actions/useLocalDeliveryHeaderAction'
import { DeliveryReadyIcon } from '@/assets/icons'


type LocalDeliveryListProps = {
    localDeliveryActions: ReturnType<typeof useLocalDeliveryHeaderAction>
}

export const LocalDeliveryOrderList = ({
    localDeliveryActions
}:LocalDeliveryListProps) => {
    const { active, over } = useDndContext()
    const activeType = active?.data.current?.type
    const overType = over?.data.current?.type
    const {
        orders,
        planStartDate,
        planState,
        routeSolutionStops,
        stopByOrderId,
        ordersById,
        boundaryLocations,
        selectedRouteSolution,
        routeSolutionWarningRegistry,
    } = useLocalDeliveryContext()

    const { sortedEntries, missingOrders, sortableIds } = useLocalDeliveryStopOrdering(
        orders,
        routeSolutionStops,
        stopByOrderId,
        ordersById,
    )

    const projectedStopOrderByClientId = useMemo(() => {
        const activeIsRouteStop = activeType === 'route_stop'
        const overIsRouteStop = overType === 'route_stop'
        if (!activeIsRouteStop || !overIsRouteStop) {
            return null
        }
        if (!active || !over) {
            return null
        }

        const fromIndex = sortedEntries.findIndex((entry) => entry.stop.client_id === active.id.toString())
        const toIndex = sortedEntries.findIndex((entry) => entry.stop.client_id === over.id.toString())

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            return null
        }

        const projectedEntries = arrayMove(sortedEntries, fromIndex, toIndex)
        const nextOrderMap = new Map<string, number>()
        projectedEntries.forEach((entry, index) => {
            nextOrderMap.set(entry.stop.client_id, index + 1)
        })

        return nextOrderMap
    }, [active?.id, activeType, over?.id, overType, sortedEntries])

    const strategyLabel = getRouteStrategyLabel(selectedRouteSolution?.route_end_strategy)
    const startLocationLabel = `${strategyLabel} · ${boundaryLocations.start.label}`
    const endLocationLabel = `${strategyLabel} · ${boundaryLocations.end.label}`
   
    return ( 
        <div className="flex h-full min-h-0 flex-col overflow-x-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-4 ">
                <div className="flex flex-col gap-4  h-full ">
                    { boundaryLocations.start.location &&
                        <LocalDeliveryBoundaryLocationCard
                            label={startLocationLabel}
                            address={boundaryLocations.start.location}
                            time={formatRouteTime(boundaryLocations.start.time, 'today') }
                            warnings={boundaryLocations.start.warnings}
                            planStartDate={planStartDate}
                            warningRegistry={routeSolutionWarningRegistry}
                            localDeliveryActions={localDeliveryActions}
                        />
                    }
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        {sortedEntries.map((entry) => (
                            <DraggableLocalDeliveryOrderCard
                                key={entry.stop.client_id}
                                order={entry.order}
                                stop={entry.stop}
                                displayStopOrder={projectedStopOrderByClientId?.get(entry.stop.client_id) ?? entry.stop.stop_order ?? null}
                                planStartDate={planStartDate}
                            />
                        ))}
                    </SortableContext>
                    {missingOrders.map((order) => (
                        <LocalDeliveryOrderCard
                            key={order.client_id}
                            order={order}
                            stop={null}
                            planStartDate={planStartDate}
                        />
                    ))}
                    {  boundaryLocations.end.location &&
                        <div className="pb-10">
                            <LocalDeliveryBoundaryLocationCard 
                                label={endLocationLabel}
                                address={boundaryLocations.end.location} 
                                time={ formatRouteTime(boundaryLocations.end.time, 'today') }
                                warnings={boundaryLocations.end.warnings}
                                planStartDate={planStartDate}
                                warningRegistry={routeSolutionWarningRegistry}
                                localDeliveryActions={localDeliveryActions}
                            />

                         </div>
                    }

                    { planState && planState.name.trim() == 'Open' && sortedEntries.length > 0 && 
                        <div className="pt-8 w-full flex mt-auto pb-10">
                            <BasicButton params={{
                                variant:'primary',
                                className:"w-full py-3",
                                style:{backgroundColor:'rgb(0, 172, 195)'},
                                onClick:localDeliveryActions.routeReadyForDelivery
                            }}>
                                <div className="flex gap-4">
                                    <DeliveryReadyIcon className="h-5 w-5 text-[var(--color-page)] "/>
                                    <span>
                                        Ready for Delivery
                                    </span>
                                </div>
                            </BasicButton>
                        </div>
                    
                    }
                </div>
            </div>
        </div>
    );
}

const getRouteStrategyLabel = (strategy: string | null | undefined) => {
  if (strategy === 'end_at_last_stop') return 'End at last stop'
  if (strategy === 'custom_end_address') return 'Custom end'
  return 'Round trip'
}
