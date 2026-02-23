import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { OrderFormContextValue } from './OrderForm.types'

export const OrderFormContext = createContext<OrderFormContextValue | null>(null)

export const OrderFormContextProvider = ({
  value,
  children,
}: {
  value: OrderFormContextValue
  children: ReactNode
}) => <OrderFormContext.Provider value={value}>{children}</OrderFormContext.Provider>

export const useOrderForm = () => {
  const context = useContext(OrderFormContext)
  if (!context) {
    throw new Error('OrderFormContext is not available. Wrap your app with OrderFormProvider.')
  }
  return context
}
