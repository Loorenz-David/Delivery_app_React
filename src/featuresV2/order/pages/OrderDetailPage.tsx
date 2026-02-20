import { useEffect } from 'react'

import type { StackComponentProps } from '@/shared/stack-manager/types'

import { ItemsOrderPreview } from '../item/components/ItemsOrderPreview'
import { OrderDetailSummary } from '../components/OrderDetailSummary'
import { OrderProvider } from '../context/OrderProvider'
import { useOrderActions } from '../hooks/useOrderActions'
import { useOrderFlow } from '../hooks/useOrderFlow'
import { useOrderByClientId, useOrderByServerId } from '../hooks/useOrderSelectors'
import { useOrderStateByServerId } from '../hooks/orderStates/useOrderStateSelectors'
import { OrderDetailHeader } from '../components/pageHeaders/OrderDetailHeader'

type OrderDetailPayload = {
  clientId?: string
  serverId?: number
  mode?: 'view' | 'edit'
}

const OrderDetailContent = ({ payload }: { payload?: OrderDetailPayload }) => {

  const clientId = payload?.clientId ?? null
  const serverId = payload?.serverId ?? null

  const headerActions = useOrderActions()
  const { loadOrders } = useOrderFlow()

  const orderByClient = useOrderByClientId(clientId)
  const orderByServer = useOrderByServerId(serverId)
  const order = orderByClient ?? orderByServer
  const orderServerId = typeof order?.id === 'number' ? order.id : null
  const orderState = useOrderStateByServerId(order?.order_state_id ?? null)

  useEffect(() => {
    if (order) return
    void loadOrders()
  }, [ order])



  
  return (
    <div
        className="flex min-h-0 w-full flex-1 flex-col gap-3 bg-[var(--color-page)]"

    >
      <OrderDetailHeader
        openOrderForm = {headerActions.openOrderForm}
        openOrderCases = {headerActions.openOrderCases}
        order={order}
      />

    <div className="flex min-h-0 flex-1 flex-col gap-6 ">
        <div className="flex flex-col gap-4 px-2">
          {order ? 
            <OrderDetailSummary order={order} orderState={orderState} />
            :
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
              Order not found.
            </div>
          }
        </div>

        { orderServerId !== null ? 
          <div className="flex min-h-0 flex-1 flex-col  bg-[var(--color-muted)]/10 ">
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
  )
}

export const OrderDetailPage = ({ payload }: StackComponentProps<OrderDetailPayload>) => (
  <OrderProvider>
    <OrderDetailContent payload={payload} />
  </OrderProvider>
)
