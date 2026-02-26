import type { ReactNode } from 'react'

import { OrderProvider } from '../../context/OrderProvider'
import type { OrderFormPayload } from './OrderForm.types'

import { OrderFormLayout } from './OrderForm.layout'
import { OrderFormProvider } from './OrderForm.provider'

export const OrderFormFeature = ({
  payload,
  children,
}: {
  payload?: OrderFormPayload
  children?: ReactNode
}) => (
  <OrderProvider>
    <OrderFormProvider payload={payload}>
      {children}
      <OrderFormLayout />
    </OrderFormProvider>
  </OrderProvider>
)
