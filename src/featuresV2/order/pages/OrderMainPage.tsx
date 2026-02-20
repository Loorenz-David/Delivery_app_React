
import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderMainHeader } from '../components/pageHeaders/OrderMainHeader'
import { OrderList } from '../components/OrderList'
import { OrderProvider } from '../context/OrderProvider'
import { useOrderContext } from '../context/OrderContext'
import type { Order } from '../types/order'

const OrderMainContent = () => {
  const { orders, orderActions, query } = useOrderContext()

  const handleOpenOrder = (order: Order) => {
    orderActions.openOrderDetail({ clientId: order.client_id, mode: 'view' })
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-primary)]/5">
      <OrderMainHeader 
        onCreate={() => orderActions.openOrderForm({ mode: 'create' })}
        applySearch={orderActions.applySearch}
        applyFilters={orderActions.applyFilters}
        query={query}
        updateFilters={orderActions.updateFilters}
        deleteFilter={orderActions.deleteFilter}

      />
      <div className="flex-1 overflow-y-auto p-2">
        <OrderList orders={orders}  onOpenOrder={handleOpenOrder} />
      </div>
    </div>
  )
}

export const OrderMainPage = (_: StackComponentProps<undefined>) => (
  <OrderProvider>
    <OrderMainContent />
  </OrderProvider>
)
