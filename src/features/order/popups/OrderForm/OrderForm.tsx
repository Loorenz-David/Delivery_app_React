import type { StackComponentProps } from '@/shared/stack-manager/types'
import { AnimatePresence } from 'framer-motion'

import { OrderFormFeature } from '@/features/order/forms/orderForm/OrderForm'
import { OrderFormDesktopLayout } from '@/features/order/forms/orderForm/OrderFormDesktop.layout'
import {
  useOrderFormLayoutModel,
  type OrderFormLayoutModel,
} from '@/features/order/forms/orderForm/OrderForm.layout.model'
import { OrderFormMobileLayout } from '@/features/order/forms/orderForm/OrderFormMobile.layout'
import type { OrderFormPayload } from '@/features/order/forms/orderForm/OrderForm.types'
import {
  useOrderFormExternalFlow,
  type OrderFormExternalFlow,
} from '@/features/order/forms/orderForm/useOrderFormExternalFlow'
import { ConfirmActionPopup } from '@/shared/popups/ConfirmActionPopup'

import { OrderFormShell } from './OrderFormShell'

type OrderFormPopupViewProps = {
  model: OrderFormLayoutModel
  externalFlow: OrderFormExternalFlow
}

const OrderFormPopupBody = () => {
  const model = useOrderFormLayoutModel()
  const externalFlow = useOrderFormExternalFlow()

  return (
    <>
      <OrderFormShell<OrderFormPopupViewProps>
        onRequestClose={model.closeController.requestClose}
        desktopView={OrderFormDesktopLayout}
        mobileView={OrderFormMobileLayout}
        viewProps={{ model, externalFlow }}
      />
      <AnimatePresence>
        {model.closeController.closeState === 'confirming' ? (
          <div className="fixed inset-0 z-[120]">
            <ConfirmActionPopup
              onConfirm={model.closeController.confirmClose}
              onCancel={model.closeController.cancelClose}
              message="You have unsaved changes. Close without saving?"
            />
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export const OrderForm = ({ payload, onClose }: StackComponentProps<OrderFormPayload>) => (
  <OrderFormFeature payload={payload} onClose={onClose}>
    <OrderFormPopupBody />
  </OrderFormFeature>
)
