import type { StackComponentProps } from '@/shared/stack-manager/types'
import { SlideCarousel } from '@/shared/layout/slideCarousel'

import { ItemsOrderPreview } from '../item'

import { OrderDetailSummary } from '../components/OrderDetailSummary'
import { OrderDetailHeader } from '../components/pageHeaders/OrderDetailHeader'
import { OrderDetailProvider } from '../context/OrderDetailProvider'
import { useOrderDetailContext } from '../context/OrderDetailContext'
import { OrderDetailTimeWindows } from '../components/OrderDetailTimeWindows'

export type OrderDetailPayload = {
  clientId?: string
  serverId?: number
  mode?: 'view' | 'edit'
}

const OrderDetailContent = () => {
  const {
    order,
    orderState,
    orderServerId,
    openOrderForm,
    openOrderCases,
    closeOrderDetail,
    advanceDetailOrderState,
  } = useOrderDetailContext()

  return (
    <div className="flex min-h-0 h-full w-full flex-1 flex-col bg-[var(--color-page)]   border-l-[var(--color-primary)]/30 border-l-1 overflow-y-auto">
    <div
        className="flex min-h-0 h-full w-full flex-1 flex-col bg-[var(--color-muted)]/10   border-l-[var(--color-primary)]/30 border-l-1 overflow-y-auto"

    >
      <OrderDetailHeader
        openOrderForm={openOrderForm}
        openOrderCases={openOrderCases}
        onClose={closeOrderDetail}
        onAdvanceOrderState={advanceDetailOrderState}
        order={order}
      />

    <div className="flex min-h-0 flex-1 h-full flex-col gap-6 pt-3 bg-[var(--color-page)]">
        <div className="flex flex-col gap-4 px-5 ">
          <SlideCarousel>
            {order ? (
              <OrderDetailSummary order={order} orderState={orderState} />
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
                Order not found.
              </div>
            )}

            {order ? (
              <OrderDetailTimeWindows order={order} />
            ) : null}
          </SlideCarousel>
        </div>

        { orderServerId !== null ? 
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-muted)]/10"
          
          >
            <ItemsOrderPreview 
              orderId={orderServerId} 
              stickyHeader
            />
          </div>
          :
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-xs text-[var(--color-muted)]">
            Items are available after the order has a server id.
          </div>
        }
        
      </div>
    </div>
    </div>
  )
}

export const OrderDetailPage = ({ payload, onClose }: StackComponentProps<OrderDetailPayload>) => (
  <OrderDetailProvider payload={payload} onClose={onClose}>
    <OrderDetailContent />
  </OrderDetailProvider>
)


