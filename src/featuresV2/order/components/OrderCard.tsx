import { useOrderStateByServerId } from '@/featuresV2/order/hooks/orderStates/useOrderStateSelectors'
import { ItemIcon } from '@/assets/icons'

import type { Order } from '../types/order'
import { StateCard } from '@/shared/layout/StateCard'

type OrderCardProps = {
  order: Order
  onOpen?: (order: Order) => void
}

export const OrderCard = ({ order,  onOpen }: OrderCardProps) => {
  const orderLabel = order.reference_number ?? order.external_order_id ?? order.client_id
  const streetAddress = order.client_address?.street_address ?? 'No address'
  const itemCount = order.total_items ?? 0

  const orderState =  useOrderStateByServerId( order.order_state_id ?? 1 )
  const external_source = order.external_source 
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-muted)]/30 bg-white p-4"
      onClick={() => onOpen?.(order)}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex gap-3">
          <span className="truncate text-base font-semibold text-[var(--color-text)]">{orderLabel}</span>
          {external_source && (
            <div className="flex items-center justify-center">
              <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[0.5rem] uppercase tracking-wide text-[var(--color-muted)]">
                {external_source}
              </span>
            </div>
          )}
        </div>
         { orderState && 
              <div className="flex gap-3 items-center">
                  <StateCard label={orderState.name} color={orderState.color ? orderState.color : "#363636ff"}/>
              </div>
          }

      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
          <span className="truncate text-xs text-[var(--color-muted)]">{streetAddress}</span>
          <div className="flex items-center gap-2">
            <ItemIcon className="h-3 w-3 app-icon" />
            <span>{itemCount}</span>
          </div>
      </div>
    </div>
  )
}
