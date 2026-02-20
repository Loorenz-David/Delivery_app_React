import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderProvider } from '../../context/OrderProvider'
import type { OrderFormPayload } from './OrderForm.types'

import { OrderFormLayout } from './OrderForm.layout'
import { OrderFormProvider } from './OrderForm.provider'

export const OrderForm = ({ payload }: StackComponentProps<OrderFormPayload>) => (
  <OrderProvider>
    <OrderFormProvider payload={payload}>
      <OrderFormLayout />
    </OrderFormProvider>
  </OrderProvider>
)
