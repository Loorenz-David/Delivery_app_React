import type { RefObject } from 'react'
import { useEffect } from 'react'

import { hasFormChanges } from '@/shared/data-validation/compareChanges'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'

import type { OrderFormMode, OrderFormState } from '@/featuresV2/order/forms/orderForm/OrderForm.types'



export const useOrderFormPopupConfig = ({
  mode,
  formState,
  initialFormRef,
}: {
  mode: OrderFormMode
  formState: OrderFormState
  initialFormRef: RefObject<OrderFormState | null>
}) => {
  const { setPopupHeader, registerCloseGuard, clearCloseGuard  } = usePopupContext()
  
  useEffect(() => {
    const label = mode === 'create' ? 'Create Order' : 'Edit Order'
    setPopupHeader({ label, excludeHeader:true })
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader])

  useEffect(() => {
    registerCloseGuard(() => !hasFormChanges(formState, initialFormRef))
    return () => clearCloseGuard()
  }, [formState, initialFormRef])

  
}
