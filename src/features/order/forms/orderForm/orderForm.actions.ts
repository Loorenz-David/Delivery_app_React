import type { RefObject } from 'react'
import { useCallback } from 'react'

import { useMessageHandler } from '@/shared/message-handler'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

import type { useOrderItemDraftController } from '../../item'
import type { Item } from '../../item'
import { useOrderController } from '../../controllers/order.controller'
import { useDownloadTemplateByEventFlow } from '@/features/templates/printDocument/flows'
import { itemsForDownloading } from '../../item'
import type { Order } from '../../types/order'
import type { OrderFormMode, OrderFormState } from './OrderForm.types'
import { normalizeFormStateForSave } from '../../api/mappers/orderForm.normalize'
import {
  useOrderFormSubmitController,
  type OrderFormSubmitResult,
} from './orderFormSubmit.controller'

type ItemDraftControllerApi = Pick<
  ReturnType<typeof useOrderItemDraftController>,
  'getCreatedItems' | 'getUpdatedItems' | 'getDeletedItems' | 'reset'
>

const closeOrderPopup = (popupManager: ReturnType<typeof usePopupManager>) => {
  popupManager.closeByKey('order.edit')
  popupManager.closeByKey('order.create')
}

export const mapSubmitResultToFeedback = (result: OrderFormSubmitResult) => {
  if (result.status === 'success_create') {
    return {
      status: 200,
      message: 'Order successfully created.',
      shouldClosePopup: true,
    } as const
  }

  if (result.status === 'success_edit') {
    return {
      status: 200,
      message: 'Order successfully updated.',
      shouldClosePopup: true,
    } as const
  }

  if (result.status === 'no_changes') {
    return {
      status: 400,
      message: 'No changes to save.',
      shouldClosePopup: false,
    } as const
  }

  if (result.status === 'validation_error' || result.status === 'dependency_error') {
    return {
      status: 400,
      message: result.message,
      shouldClosePopup: false,
    } as const
  }

  return {
    status: 500,
    message: result.message,
    shouldClosePopup: false,
  } as const
}

export const useOrderFormActions = ({
  mode,
  order,
  orderServerId,
  formState,
  validateForm,
  initialFormRef,
  itemDraftController,
  itemInitialByClientId,
}: {
  mode: OrderFormMode
  order: Order | null
  orderServerId: number | null
  formState: OrderFormState
  validateForm: () => boolean
  initialFormRef: RefObject<OrderFormState | null>
  itemDraftController: ItemDraftControllerApi
  itemInitialByClientId: Record<string, Item>
}) => {
  const { showMessage } = useMessageHandler()
  const { deleteOrderByServerId } = useOrderController()
  const { executeSubmit } = useOrderFormSubmitController()
  const { downloadByEvent } = useDownloadTemplateByEventFlow()
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()

  const handleSave = useCallback(async () => {
    const createdItems = itemDraftController.getCreatedItems()
    const normalizedCurrent = normalizeFormStateForSave(formState)

    const result = await executeSubmit({
      mode,
      order,
      orderServerId,
      formState,
      validateForm,
      initialFormRef,
      itemDraftController,
      itemInitialByClientId,
    })

    const feedback = mapSubmitResultToFeedback(result)

    if (result.status === 'success_create') {
      if (createdItems.length > 0) {
        downloadByEvent({
          channel: 'item',
          event: 'item_created',
          data: itemsForDownloading(
            createdItems,
            normalizedCurrent?.reference_number,
            normalizedCurrent?.delivery_plan_id,
          ),
          fileName: 'first test',
        })
      }
    }

    showMessage({ status: feedback.status, message: feedback.message })
    if (feedback.shouldClosePopup) {
      closeOrderPopup(popupManager)
    }
  }, [
    downloadByEvent,
    executeSubmit,
    formState,
    initialFormRef,
    itemDraftController,
    itemInitialByClientId,
    mode,
    order,
    orderServerId,
    popupManager,
    showMessage,
  ])

  const handleDelete = useCallback(async () => {
    if (mode !== 'edit') return
    if (!order?.id || !order?.client_id) return

    const success = await deleteOrderByServerId(order.id, order.client_id)
    if (success) {
      closeOrderPopup(popupManager)
      sectionManager.closeByKey('order.details')
    }
  }, [deleteOrderByServerId, mode, order?.client_id, order?.id, popupManager, sectionManager])

  return {
    handleSave,
    handleDelete,
  }
}
