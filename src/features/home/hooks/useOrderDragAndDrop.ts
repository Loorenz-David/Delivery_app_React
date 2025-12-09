import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'

import type{  OrderPayload } from '../types/backend'

type DropIndicator = { id: number; position: 'before' | 'after' } | null

interface ReorderMeta {
  movedOrderId?: number | null
}

interface UseOrderDragAndDropArgs {
  ordersInput: OrderPayload[]
  onReorder?: (nextOrders: OrderPayload[], meta?: ReorderMeta) => void
  sourceRouteId?: number | null
}

export function useOrderDragAndDrop({ ordersInput, onReorder, sourceRouteId = null }: UseOrderDragAndDropArgs) {
  const [orders, setOrders] = useState<OrderPayload[]>(ordersInput)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)
  const draggingIdRef = useRef<number | null>(null)

  const areOrdersEqual = useCallback((a: OrderPayload[], b: OrderPayload[]) => {
    if (a === b) {
      return true
    }
    if (a.length !== b.length) {
      return false
    }
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) {
        return false
      }
    }
    return true
  }, [])

  useEffect(() => {
    setOrders((previous) => {
      if (areOrdersEqual(previous, ordersInput)) {
        return previous
      }
      return ordersInput
    })
  }, [areOrdersEqual, ordersInput])

  const updateDraggingId = useCallback((nextId: number | null) => {
    draggingIdRef.current = nextId
    setDraggingId(nextId)
  }, [])

  const persistOrderSequence = useCallback(
    (nextOrders: OrderPayload[], movedOrderId?: number | null) => {
      onReorder?.(nextOrders, { movedOrderId })
    },
    [onReorder],
  )

  const moveOrder = useCallback(
    (fromId: number, targetId: number, position: 'before' | 'after') => {
      if (fromId === targetId) {
        return
      }

      setOrders((previous) => {
        const updated = [...previous]
        const fromIndex = updated.findIndex((order) => order.id === fromId)
        const targetIndex = updated.findIndex((order) => order.id === targetId)
        if (fromIndex === -1 || targetIndex === -1) {
          return previous
        }

        const [removed] = updated.splice(fromIndex, 1)
        
        let insertIndex = position === 'before' ? targetIndex : targetIndex + 1
        if (fromIndex < insertIndex) {
          insertIndex -= 1
        }

        updated.splice(insertIndex, 0, removed)
        persistOrderSequence(updated, fromId)
        return updated
      })
    },
    [persistOrderSequence],
  )

  const finishDrag = useCallback(() => {
    updateDraggingId(null)
    setDropIndicator(null)
  }, [updateDraggingId])

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, orderId: number) => {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(orderId))
    try {
      event.dataTransfer.setData(
        'application/x-order-transfer',
        JSON.stringify({ orderId, routeId: sourceRouteId }),
      )
    } catch {
      // ignore serialization error
    }
    updateDraggingId(orderId)
  }, [sourceRouteId, updateDraggingId])

  const handleDragOverCard = useCallback(
    (event: DragEvent<HTMLDivElement>, targetId: number) => {
      event.preventDefault()
      const currentDraggingId = draggingIdRef.current
      if (!currentDraggingId || currentDraggingId === targetId) {
        setDropIndicator(null)
        return
      }

      const bounds = event.currentTarget.getBoundingClientRect()
      const isBefore = event.clientY < bounds.top + bounds.height / 2
      setDropIndicator({ id: targetId, position: isBefore ? 'before' : 'after' })
    },
    [],
  )

  const handleDropOnCard = useCallback(
    (event: DragEvent<HTMLDivElement>, targetId: number) => {
      event.preventDefault()
      event.stopPropagation()
      const currentDraggingId = draggingIdRef.current
      if (!currentDraggingId) {
        finishDrag()
        return
      }

      const bounds = event.currentTarget.getBoundingClientRect()
      const isBefore = event.clientY < bounds.top + bounds.height / 2
      const position =
        dropIndicator && dropIndicator.id === targetId ? dropIndicator.position : isBefore ? 'before' : 'after'
      moveOrder(currentDraggingId, targetId, position)
      finishDrag()
    },
    [dropIndicator, finishDrag, moveOrder],
  )

  const handleDropAtEnd = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const currentDraggingId = draggingIdRef.current
      if (!currentDraggingId || orders.length === 0) {
        finishDrag()
        return
      }
      const lastOrderId = orders[orders.length - 1].id
      moveOrder(currentDraggingId, lastOrderId, 'after')
      finishDrag()
    },
    [finishDrag, moveOrder, orders],
  )

  const handleListDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!draggingIdRef.current) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleListDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const currentDraggingId = draggingIdRef.current
      if (!currentDraggingId || !dropIndicator) {
        finishDrag()
        return
      }
      moveOrder(currentDraggingId, dropIndicator.id, dropIndicator.position)
      finishDrag()
    },
    [dropIndicator, finishDrag, moveOrder],
  )

  return {
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
    setDropIndicator,
  }
}
