import type { RefObject } from 'react'
import { useCallback } from 'react'

import { useMessageHandler } from '@/shared/message-handler'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

import type { useOrderItemDraftController } from '../../item'
import type { Item } from '../../item'
import { useCreateItem, useDeleteItem, useUpdateItem } from '../../item'
import { useItemFlow } from '../../item'
import { useOrderController } from '../../controllers/order.controller'
import { useOrderValidation } from '../../domain/useOrderValidation'
import { useDownloadTemplateByEventFlow } from '@/features/templates/printDocument/flows'
import { itemsForDownloading } from '../../item'
import type { Order } from '../../types/order'
import type { OrderFormMode, OrderFormState } from './OrderForm.types'
import { normalizeFormStateForSave } from '../../api/mappers/orderForm.normalize'
import {
  executeOrderFormSubmit,
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

const getOrderPopupKeyByMode = (mode: OrderFormMode) =>
  mode === 'create' ? 'order.create' : 'order.edit'

const reopenOrderFormOnRollback = ({
  popupManager,
  mode,
  order,
  formState,
}: {
  popupManager: ReturnType<typeof usePopupManager>
  mode: OrderFormMode
  order: Order | null
  formState: OrderFormState
}) => {
  closeOrderPopup(popupManager)
  popupManager.open({
    key: getOrderPopupKeyByMode(mode),
    payload: {
      mode,
      clientId: order?.client_id,
      deliveryPlanId: formState.delivery_plan_id ?? null,
      restoreFormState: structuredClone(formState),
      controllBodyLayout: true,
    },
  })
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

const presentSubmitOutcome = ({
  result,
  createdItems,
  normalizedCurrent,
  downloadByEvent,
  showMessage,
  popupManager,
}: {
  result: OrderFormSubmitResult
  createdItems: Item[]
  normalizedCurrent: ReturnType<typeof normalizeFormStateForSave>
  downloadByEvent: ReturnType<typeof useDownloadTemplateByEventFlow>['downloadByEvent']
  showMessage: ReturnType<typeof useMessageHandler>['showMessage']
  popupManager: ReturnType<typeof usePopupManager>
}) => {
  const feedback = mapSubmitResultToFeedback(result)

  if (result.status === 'success_create' && createdItems.length > 0) {
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

  showMessage({ status: feedback.status, message: feedback.message })
  if (feedback.shouldClosePopup) {
    closeOrderPopup(popupManager)
  }
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
  const { deleteOrderByServerId, saveOrder } = useOrderController()
  const createItemApi = useCreateItem()
  const updateItemApi = useUpdateItem()
  const deleteItemApi = useDeleteItem()
  const { loadItemsByOrderId } = useItemFlow()
  const validation = useOrderValidation()
  const { downloadByEvent } = useDownloadTemplateByEventFlow()
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()

  const handleSave = useCallback(() => {
    const createdItems = itemDraftController.getCreatedItems()
    const normalizedCurrent = normalizeFormStateForSave(formState)
    void executeOrderFormSubmit(
      {
        saveOrder,
        createItemApi,
        updateItemApi,
        deleteItemApi,
        loadItemsByOrderId,
        validateOrderFields: validation.validateOrderFields,
      },
      {
        mode,
        order,
        orderServerId,
        formState,
        validateForm,
        initialFormRef,
        itemDraftController,
        itemInitialByClientId,
        onOrderRollback: () =>
          reopenOrderFormOnRollback({
            popupManager,
            mode,
            order,
            formState,
          }),
      },
    ).then((result) => {
      presentSubmitOutcome({
        result,
        createdItems,
        normalizedCurrent,
        downloadByEvent,
        showMessage,
        popupManager,
      })
    })
  }, [
    createItemApi,
    deleteItemApi,
    downloadByEvent,
    loadItemsByOrderId,
    formState,
    initialFormRef,
    itemDraftController,
    itemInitialByClientId,
    mode,
    order,
    orderServerId,
    popupManager,
    saveOrder,
    showMessage,
    updateItemApi,
    validation.validateOrderFields,
  ])

  const handleDelete = useCallback(async () => {
    if (mode !== 'edit') return
    if (!order?.id || !order?.client_id) return

    const success =  await deleteOrderByServerId(order.id, order.client_id)
    if(success){
      closeOrderPopup(popupManager)
      sectionManager.closeByKey('order.details')
    }
    
    
  }, [deleteOrderByServerId, mode, order?.client_id, order?.id, popupManager, sectionManager])

  return {
    handleSave,
    handleDelete,
  }
}
