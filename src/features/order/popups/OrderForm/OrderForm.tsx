import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderFormFeature } from '@/features/order/forms/orderForm/OrderForm'
import { useOrderForm } from '@/features/order/forms/orderForm/OrderForm.context'
import type { OrderFormPayload } from '@/features/order/forms/orderForm/OrderForm.types'

import { useOrderFormPopupConfig } from './OrderFormPopupConfig.hook'

const OrderFormPopupConfigBridge = () => {
  const { formState, meta } = useOrderForm()
  const { mode, initialFormRef } = meta
  useOrderFormPopupConfig({ mode, formState, initialFormRef })
  return null
}

export const OrderForm = ({ payload }: StackComponentProps<OrderFormPayload>) => (
  <OrderFormFeature payload={payload}>
    <OrderFormPopupConfigBridge />
  </OrderFormFeature>
)
