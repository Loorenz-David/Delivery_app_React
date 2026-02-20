import type { RefObject } from 'react'
import { useEffect } from 'react'

import { hasFormChanges } from '@/shared/data-validation/compareChanges'
import type { PropsPopupContext } from '@/shared/popups/MainPopup/PopupContext'

import type { Item, ItemPopupPayload } from '../../types'

export type ItemFormPopupBindings = Pick<
  PropsPopupContext,
  'setPopupHeader' | 'registerCloseGuard' | 'clearCloseGuard'
>

export const useItemFormConfig = ({
  payload,
  formState,
  initialFormRef,
  popupBindings,
}: {
  payload: ItemPopupPayload
  formState: Item
  initialFormRef: RefObject<Item | null>
  popupBindings?: ItemFormPopupBindings
}) => {
  useEffect(() => {
    if (!popupBindings) {
      return
    }

    const isEdit = payload.mode === 'autonomous' && Boolean(payload.itemId)
    const label = isEdit ? 'Edit Item' : 'Create Item'

    popupBindings.setPopupHeader({ label })
    return () => popupBindings.setPopupHeader(null)
  }, [payload])

  useEffect(() => {
    if (!popupBindings) {
      return
    }

    popupBindings.registerCloseGuard(() => !hasFormChanges(formState, initialFormRef))
    return () => popupBindings.clearCloseGuard()
  }, [formState, initialFormRef])
}
