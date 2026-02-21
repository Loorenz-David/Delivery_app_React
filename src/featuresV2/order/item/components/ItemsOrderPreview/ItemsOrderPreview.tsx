import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { BasicButton } from '@/shared/buttons/BasicButton'

import { useItemRules } from '../../domain/useItemRules'
import { useItemActions } from '../../hooks/useItemActions'
import { useItemFlow } from '../../hooks/useItemFlow'
import type { Item } from '../../types'
import { ItemCard } from '../ItemCard'

export type ItemsOrderPreviewProps = {
  orderId?: number
  controlled?: boolean
  items?: Item[]
  header?: ReactNode
  onAddItem?: () => void
  onEditItem?: (item: Item) => void
  stickyHeader?: boolean
  scrollBody?:boolean
}

export const ItemsOrderPreview = ({
  orderId,
  controlled = false,
  items: controlledItems,
  header,
  onAddItem,
  onEditItem,
  scrollBody = false,
  stickyHeader = false,
}: ItemsOrderPreviewProps) => {
  const { loadItemsByOrderId, isLoadingItems, items: flowItems } = useItemFlow({ orderId: orderId ?? null })
  const { openCreateItem, openEditItem } = useItemActions()
  const { calculateOrderItemStats } = useItemRules()
  const [expandedItemClientId, setExpandedItemClientId] = useState<string | null>(null)

  useEffect(() => {
    if (controlled || typeof orderId !== 'number') return
    void loadItemsByOrderId(orderId)
  }, [controlled, loadItemsByOrderId, orderId])

  const resolvedItems: Item[] = controlled ? (controlledItems ?? []) : flowItems
  const resolvedLoading = controlled ? false : isLoadingItems
  const stats = calculateOrderItemStats(resolvedItems)

  useEffect(() => {
    if (expandedItemClientId == null) return
    const currentItems = controlled ? (controlledItems ?? []) : flowItems
    const stillExists = currentItems.some((entry) => entry.client_id === expandedItemClientId)
    if (!stillExists) {
      setExpandedItemClientId(null)
    }
  }, [controlled, controlledItems, expandedItemClientId, flowItems])

  const handleAddItem = () => {
    if (onAddItem) {
      onAddItem()
      return
    }

    if (typeof orderId !== 'number') return
    openCreateItem(orderId)
  }

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col "
    >
      {header ?? (
        <div
          className={`flex items-center justify-between gap-3 bg-[var(--color-page)] px-3 py-5 shadow-md ${
            stickyHeader ? 'sticky top-0 ' : ''
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Items</p>
            <p className="text-xs text-[var(--color-muted)]">
              {stats.totalItems} items • {stats.totalWeight.toFixed(2)} kg • {stats.totalVolume.toFixed(2)} ㎥
            </p>
          </div>

          <BasicButton params={{ variant: 'primary', onClick: handleAddItem, ariaLabel: 'Add item' }}>
            + Item
          </BasicButton>
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col gap-3 px-3 py-5  ${scrollBody ? 'overflow-y-scroll': ''}`}>
        {resolvedLoading ? (
            <div className="text-xs text-[var(--color-muted)]">Loading items...</div>
          ) : resolvedItems.length ? (
              resolvedItems.map((item) => (
                <ItemCard
                  key={item.client_id}
                  item={item}
                  showDelete={!controlled}
                  isExpanded={expandedItemClientId === item.client_id}
                  onToggleExpand={() => {
                    setExpandedItemClientId((current) =>
                      current === item.client_id ? null : item.client_id,
                    )
                  }}
                  onEdit={
                    onEditItem
                      ? () => onEditItem(item)
                      : () => {
                          if (typeof orderId !== 'number') return
                          openEditItem(orderId, item.client_id)
                        }
                  }
                />
              ))
          
          ) : (
            <div className="text-xs text-[var(--color-muted)]">No items yet.</div>
          )}
       </div>
    </section>
  )
}
