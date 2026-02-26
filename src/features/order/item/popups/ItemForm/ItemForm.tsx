import type { StackComponentProps } from '@/shared/stack-manager/types'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { usePopupManager } from '@/shared/resource-manager/useResourceManager'

import type { ItemPopupPayload } from '../../types'

import { ItemFormLayout } from './ItemForm.layout'
import { ItemFormProvider } from './ItemForm.provider'

export const ItemForm = ({ payload }: StackComponentProps<ItemPopupPayload>) => {
  const popupManager = usePopupManager()
  const popupBindings = usePopupContext()

  const closeItemForm = () => {
    popupManager.closeByKey('order.item.edit')
    popupManager.closeByKey('order.item.create')
  }

  return (
    <ItemFormProvider payload={payload} closeItemForm={closeItemForm} popupBindings={popupBindings}>
      <ItemFormLayout />
    </ItemFormProvider>
  )
}
