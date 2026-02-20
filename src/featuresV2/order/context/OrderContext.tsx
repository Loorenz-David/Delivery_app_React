import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'


import type { Order } from '../types/order'
import type { useOrderActions } from '../hooks/useOrderActions'
import type { OrderQueryFilters } from '../types/orderMeta'

export type OrderContextValue = {
  orders: Order[]
  orderActions: ReturnType<typeof useOrderActions>
  query: {
    q: string
    filters: OrderQueryFilters
  }
}

export const OrderContext = createContext<OrderContextValue | null>(null)

export const OrderContextProvider = ({ value, children }: { value: OrderContextValue; children: ReactNode }) => (
  <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
)

export const useOrderContext = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrderContext must be used within OrderProvider')
  }
  return context
}
