import type { ReactNode } from 'react'

import { OrderProvider } from '../../context/OrderProvider'
import type { OrderFormPayload } from './OrderForm.types'
import { OrderFormProvider } from './OrderForm.provider'

export const OrderFormFeature = ({
  payload,
  onClose,
  children,
}: {
  payload?: OrderFormPayload
  onClose?: () => void
  children: ReactNode
}) => (
  <OrderProvider>
    <OrderFormProvider payload={payload} onClose={onClose}>
      {children}
    </OrderFormProvider>
  </OrderProvider>
)
