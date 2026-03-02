import { useMemo } from 'react'
import { useDndContext } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

type SortEntry = {
  stop: {
    client_id: string
  }
}

export const useLocalDeliveryDndProjectionFlow = (sortedEntries: SortEntry[]) => {
  const { active, over } = useDndContext()
  const activeType = active?.data.current?.type
  const overType = over?.data.current?.type

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
  }, [active, activeType, over, overType, sortedEntries])

  return {
    projectedStopOrderByClientId,
  }
}
