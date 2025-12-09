import React, { useMemo, useRef } from "react";
import type { HTMLAttributes, DragEventHandler } from "react";

import { ChevronDownIcon, DragHandleIcon, ItemIcon, TimeIcon } from "../../../../assets/icons";

import { cn } from '../../../../lib/utils/cn'

import type { OrderPayload } from '../../types/backend'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'
import type { ItemStateOption } from '../../api/optionServices'
import { deriveOrderStateFromItems } from '../../utils/orderState'
import { ItemCard } from "./ItemCard";




interface OrderCardProps {
  order: OrderPayload;
  onSelect: (id:number)=>void
  isExpanded?: boolean;
  isDragging?: boolean;
  dropIndicator?: 'before' | 'after' | null;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
  isSkipped?: boolean;
  onToggleExpand?: (orderId: number) => void;
  onItemAction?: (action: string, itemId: number, data?: unknown) => void;
}




export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onSelect,
  isExpanded = false,
  isDragging = false,
  dropIndicator = null,
  dragHandleProps,
  onDragOver,
  onDrop,
  isSkipped = false,
  onToggleExpand,
  onItemAction,
}) => {
  const { className: dragHandleClassName, onDragStart, onDragEnd, ...restDragHandle } = dragHandleProps ?? {}
  const cardRef = useRef<HTMLDivElement>(null)
  const dragPreviewRef = useRef<HTMLElement | null>(null)
  const optionDataManager = useResourceManager('optionDataManager')
  const optionSnapshot = useDataManager(optionDataManager)
  const formattedArrivalTime = useMemo(() => formatExpectedTime(order.expected_arrival_time), [order.expected_arrival_time])
  const derivedOrderState = useMemo(() => {
    const stateMap = optionSnapshot.dataset?.item_states_map as Record<number, ItemStateOption> | undefined
    return deriveOrderStateFromItems(order.delivery_items ?? [], stateMap ?? {})
  }, [order.delivery_items, optionSnapshot.dataset?.item_states_map])
  const orderStateLabel = derivedOrderState?.name ?? 'Pending'
  const orderStateColor = derivedOrderState?.color ?? '#facc15'
  const items = order.delivery_items ?? []
  const itemCount = items.length

  const cleanupDragPreview = () => {
    if (dragPreviewRef.current && dragPreviewRef.current.parentNode) {
      dragPreviewRef.current.parentNode.removeChild(dragPreviewRef.current)
      dragPreviewRef.current = null
    }
  }

  const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const clone = cardRef.current.cloneNode(true) as HTMLElement
        clone.style.opacity = '0.4' 
        clone.style.filter = 'brightness(0.7)' 
        clone.style.position = 'absolute'
        clone.style.pointerEvents = 'none'
        clone.style.top = '-9999px'
        clone.style.left = '-9999px'
        clone.style.width = `${rect.width}px`
        clone.style.height = `${rect.height}px`
        clone.style.boxSizing = 'border-box'
        document.body.appendChild(clone)
      dragPreviewRef.current = clone
      event.dataTransfer.setDragImage(clone, event.clientX - rect.left, event.clientY - rect.top)
    }
    onDragStart?.(event)
  }

  const handleDragEnd: DragEventHandler<HTMLDivElement> = (event) => {
    cleanupDragPreview()
    onDragEnd?.(event)
  }

  return (
    <div
      className={cn(
        "relative flex w-full rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200",
        "hover:shadow-md",
        isDragging && "opacity-40",
        isSkipped && "border-red-200 bg-red-50"
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      ref={cardRef}
    >
      {dropIndicator === 'before' && (
        <div className="absolute left-3 right-3 top-0 h-0.5 -translate-y-1/2 rounded bg-blue-500" />
      )}
      {dropIndicator === 'after' && (
        <div className="absolute left-3 right-3 bottom-0 h-0.5 translate-y-1/2 rounded bg-blue-500" />
      )}

      <div className="flex w-full flex-col">
        {/* Header */}
        <div
          className="flex items-start  pr-3 pt-3 cursor-pointer"
          onClick={() => {
            onSelect(order.id)
          }}
        >
          <div
            className={cn(
              "flex w-fit cursor-grab text-base text-gray-400 transition active:cursor-grabbing h-full px-2",
              dragHandleClassName
            )}
            {...restDragHandle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(event) => event.stopPropagation()}
          >
            <DragHandleIcon className="app-icon h-5 w-5" />
          </div>

          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-50 text-[0.75rem] font-semibold text-blue-600">
                {(order.delivery_arrangement ?? 0) + 1}
              </div>
              <div className="min-w-0 space-y-0.5">
                <h2 className="text-sm font-semibold leading-tight text-gray-800 break-words">
                  {order.client_address.raw_address}
                </h2>
                <p className="truncate text-xs text-gray-500">
                  {order?.client_first_name} {order?.client_last_name}
                </p>
              </div>
            </div>
            <span
              className="whitespace-nowrap rounded-md px-2.5 py-0.5 text-[0.65rem] font-medium"
              style={{
                backgroundColor: `${orderStateColor}20`,
                color: orderStateColor,
                border: `1px solid ${orderStateColor}`,
              }}
            >
              {orderStateLabel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="mt-3 border-t border-gray-100">
          <div
            className="flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-gray-100"
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand?.(order.id)
            }}
          >
            <div className="flex items-center gap-2">
              <ItemIcon className="app-icon h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">{itemCount} items</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3 text-[0.72rem] text-gray-600">
              {(isSkipped || formattedArrivalTime) && (
                <div className="flex items-center gap-1">
                  <TimeIcon className={cn("app-icon h-3.5 w-3.5", isSkipped ? "text-red-500" : "text-gray-400")} />
                  <span className={cn(isSkipped ? "text-red-700 font-semibold" : undefined)}>
                    {isSkipped ? 'Out of Range' : formattedArrivalTime}
                  </span>
                </div>
              )}

              {order.delivery_after && (
                <div className="flex items-center gap-1">
                  <TimeIcon className="app-icon h-3.5 w-3.5 text-gray-400" />
                  <span>After {order.delivery_after}</span>
                </div>
              )}

              {order.delivery_before && (
                <div className="flex items-center gap-1">
                  <TimeIcon className="app-icon h-3.5 w-3.5 text-gray-400" />
                  <span>Before {order.delivery_before}</span>
                </div>
              )}
            </div>
            <ChevronDownIcon
              className={cn(
                "app-icon h-4 w-4 text-gray-400 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>

          {isExpanded && (
            <div className="px-3 pb-3" onClick={(event) => event.stopPropagation()}>
              <div className="mt-2 flex flex-col gap-1.5">
                {items.length ? (
                  items.map((item,i) => (
                    <div
                      key={`Item_${item.id}_${i}`}
                      className="origin-top-left"
                      style={{ transform: 'scale(0.9)', transformOrigin: 'top left', zIndex: items.length - i }}
                    >
                      <ItemCard
                        item={{ ...item }}
                        onAction={(action, itemId, data) => onItemAction?.(action, itemId, data)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No items added.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatExpectedTime(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  const hours = parsed.getHours().toString().padStart(2, '0')
  const minutes = parsed.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
