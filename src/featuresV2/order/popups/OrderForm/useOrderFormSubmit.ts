import type { RefObject } from 'react'
import { useCallback } from 'react'

import { useMessageManager } from '@/message_manager'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import { getObjectDiff } from '@/shared/utils/getObjectDiff'

import { useCreateItem, useDeleteItem, useUpdateItem } from '../../item/api/item.api'
import { useItemFlow } from '../../item/hooks/useItemFlow'
import type { useOrderItemDraftController } from '../../item/hooks/useOrderItemDraftController'
import type { Item, ItemUpdateFields } from '../../item/types'
import { useOrderController } from '../../hooks/useOrderController'
import type { Order } from '../../types/order'
import type { OrderUpdateFields } from '../../types/order'
import type { OrderFormMode, OrderFormState } from './OrderForm.types'
import { normalizeFormStateForSave, stripImmutableItemFields } from './form/orderForm.normalize'
import { useDownloadTemplateByEventFlow } from '@/featuresV2/templates/printDocument/flows'
import { itemsForDownloading } from '../../item/domain/itemsForDownloading'
import { useOrderValidation } from '../../domain/useOrderValidation'


type ItemDraftControllerApi = Pick<
  ReturnType<typeof useOrderItemDraftController>,
  'getCreatedItems' | 'getUpdatedItems' | 'getDeletedItems' | 'reset'
>

const closeOrderPopup = (popupManager: ReturnType<typeof usePopupManager>) => {
  popupManager.closeByKey('order.edit')
  popupManager.closeByKey('order.create')
}

export const useOrderFormSubmit = ({
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
  const { showMessage } = useMessageManager()
  const { saveOrder, deleteOrderByServerId } = useOrderController()
  const createItemApi = useCreateItem()
  const updateItemApi = useUpdateItem()
  const deleteItemApi = useDeleteItem()
  const { loadItemsByOrderId } = useItemFlow()
  const { getCreatedItems, getUpdatedItems, getDeletedItems } = itemDraftController
  const { downloadByEvent } = useDownloadTemplateByEventFlow()
  const validation = useOrderValidation()
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()
  const handleSave = useCallback(async () => {
    const isValid = validateForm()
    if (!isValid) {
      showMessage({ status: 400, message: 'Please fix the highlighted fields.' })
      return
    }

    const initialForm = initialFormRef.current
    if (!initialForm) {
      showMessage({ status: 400, message: 'Missing initial form snapshot.' })
      return
    }

    const normalizedCurrent = normalizeFormStateForSave(formState)
    const normalizedInitial = normalizeFormStateForSave(initialForm)

    const orderChanges =
      mode === 'create'
        ? normalizedCurrent
        : getObjectDiff(normalizedInitial, normalizedCurrent)

    const createdItems = getCreatedItems()
    const updatedItems = getUpdatedItems()
    const deletedItemClientIds = getDeletedItems()
    const hasItemChanges =
      createdItems.length > 0 ||
      updatedItems.length > 0 ||
      deletedItemClientIds.length > 0

    if (mode === 'edit' && !Object.keys(orderChanges).length && !hasItemChanges) {
      showMessage({ status: 400, message: 'No changes to save.' })
      return
    }

    try {
      if (mode === 'create') {
        const createItemsPayload = createdItems.map((item) => {
          const payloadItem = { ...item }
          const { order_id, id, ...fields } = payloadItem
          return fields
        })
        // introduce download template when items are created 
        const createPayload = {
          ...orderChanges,
          items: createItemsPayload,
        } as OrderUpdateFields
       
        const payload = {
          mode,
          clientId: order?.client_id,
          fields: createPayload,
        }

        const isValid = validation.validateOrderFields(createPayload)
        if (!isValid) {
          showMessage({ status: 400, message: 'Please check the form inputs.' })
          return false
        }
        
        downloadByEvent({
          channel:'item',
          event:'item_created',
          data:itemsForDownloading(createdItems, normalizedCurrent?.reference_number, normalizedCurrent?.delivery_plan_id  ),
          fileName:'first test'
        })

      

        const saved = await saveOrder(payload)

        if (!saved) return

        closeOrderPopup(popupManager)
        return
      }

      if (Object.keys(orderChanges).length > 0) {

        const isValid = validation.validateOrderFields(orderChanges)
        if (!isValid) {
          showMessage({ status: 400, message: 'Please check the form inputs.' })
          return false
        }

        const orderSaved = await saveOrder({
          mode,
          clientId: order?.client_id,
          fields: orderChanges,
        })
        if (!orderSaved) return
      }

      if (hasItemChanges) {
        if (typeof orderServerId !== 'number') {
          showMessage({ status: 400, message: 'Order id is required to save item changes.' })
          return
        }

        if (createdItems.length > 0) {
          const createPayload = createdItems.map((draft) => ({
            ...draft,
            order_id: orderServerId,
          }))
          await createItemApi(createPayload)
        }

        if (updatedItems.length > 0) {
          const updatePayload = updatedItems
            .map((draft) => {
              const targetId = draft.id ?? itemInitialByClientId[draft.client_id]?.id
              if (typeof targetId !== 'number') {
                return null
              }

              return {
                target_id: targetId,
                fields: stripImmutableItemFields(draft),
              }
            })
            .filter((entry): entry is { target_id: number; fields: ItemUpdateFields } => Boolean(entry))

          if (updatePayload.length !== updatedItems.length) {
            showMessage({ status: 400, message: 'Unable to resolve item id for update.' })
            return
          }

          await updateItemApi(updatePayload)
        }

        if (deletedItemClientIds.length > 0) {
          const targetIds = deletedItemClientIds
            .map((clientId) => itemInitialByClientId[clientId]?.id)
            .filter((id): id is number => typeof id === 'number')

          if (targetIds.length !== deletedItemClientIds.length) {
            showMessage({ status: 400, message: 'Unable to resolve item id for deletion.' })
            return
          }

          await deleteItemApi({ target_ids: targetIds })
        }

        await loadItemsByOrderId(orderServerId)
      }

      closeOrderPopup(popupManager)
    } catch (error) {
      console.error('Failed to save order form transaction', error)
      showMessage({ status: 500, message: 'Unable to save order and items.' })
    }
  }, [
    createItemApi,
    deleteItemApi,
    formState,
    getCreatedItems,
    getDeletedItems,
    getUpdatedItems,
    initialFormRef,
    itemInitialByClientId,
    loadItemsByOrderId,
    mode,
    order?.client_id,
    orderServerId,
    popupManager,
    saveOrder,
    showMessage,
    updateItemApi,
    validateForm,
  ])

  const handleDelete = useCallback(async () => {
    if (mode !== 'edit') return
    if (!order?.id || !order?.client_id) return

    

    const success = await deleteOrderByServerId(order.id, order.client_id)
    if (success) {
      closeOrderPopup(popupManager)
      sectionManager.closeByKey('order.details')
    }
  }, [deleteOrderByServerId, mode, order?.client_id, order?.id, popupManager])

  return {
    handleSave,
    handleDelete,
  }
}


