 import { useEffect } from 'react'

import type { StackComponentProps } from '@/shared/stack-manager/types'

import { ItemsOrderPreview } from '../item'
import { OrderDetailSummary } from '../components/OrderDetailSummary'
import { OrderProvider } from '../context/OrderProvider'
import { useOrderActions } from '../actions/order.actions'
import { useOrderFlow } from '../flows/order.flow'
import { useOrderByClientId, useOrderByServerId } from '../store/orderHooks.store'
import { useOrderStateByServerId } from '../store/orderStateHooks.store'
import { OrderDetailHeader } from '../components/pageHeaders/OrderDetailHeader'
import { useMobile } from '@/app/contexts/MobileContext'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

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
  const {isMobile} = useMobile()

  const orderByClient = useOrderByClientId(clientId)
  const orderByServer = useOrderByServerId(serverId)
  const order = orderByClient ?? orderByServer
  const orderServerId = typeof order?.id === 'number' ? order.id : null
  const orderState = useOrderStateByServerId(order?.order_state_id ?? null)
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()

  useEffect(() => {
    if (order) return
    void loadOrders()
  }, [ order])


  const handleKeyDown = (event:KeyboardEvent)=>{
    const isPopupOpen = popupManager.getOpenCount()
    if(event.key == 'e' && clientId){
      if(isPopupOpen) return
      headerActions.openOrderForm({mode: 'edit', clientId: clientId})
    }
    if(event.key == 'c' && clientId){
      if(isPopupOpen) return
      const isCaseOpen = sectionManager.hasKey('orderCase.orderCases')
      if(isCaseOpen) return
      headerActions.openOrderCases({ orderId: order?.id, orderReference: order?.reference_number ?? '' })
    }
  }

  useEffect(()=>{
     if(!isMobile){
      window.addEventListener('keydown', handleKeyDown)
    }

      return () => {

          window.removeEventListener('keydown', handleKeyDown)
      }
  },[isMobile])

  
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
