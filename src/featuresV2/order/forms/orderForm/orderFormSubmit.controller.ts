import type { RefObject } from 'react'

import { getObjectDiff } from '@/shared/utils/getObjectDiff'

import type { useOrderItemDraftController } from '../../item'
import { useCreateItem, useDeleteItem, useUpdateItem } from '../../item'
import { useItemFlow } from '../../item'
import type { Item, ItemUpdateFields } from '../../item'
import { useOrderController } from '../../controllers/order.controller'
import { useOrderValidation } from '../../domain/useOrderValidation'
import type { Order, OrderUpdateFields } from '../../types/order'
import type { OrderFormMode, OrderFormState } from './OrderForm.types'
import { normalizeFormStateForSave, stripImmutableItemFields } from '../../api/mappers/orderForm.normalize'

type ItemDraftControllerApi = Pick<
  ReturnType<typeof useOrderItemDraftController>,
  'getCreatedItems' | 'getUpdatedItems' | 'getDeletedItems' | 'reset'
>

export type OrderFormSubmitResult =
  | { status: 'success_create' }
  | { status: 'success_edit' }
  | { status: 'no_changes' }
  | { status: 'validation_error'; message: string }
  | { status: 'dependency_error'; message: string }
  | { status: 'error'; message: string }

export type OrderFormSubmitCommand = {
  mode: OrderFormMode
  order: Order | null
  orderServerId: number | null
  formState: OrderFormState
  validateForm: () => boolean
  initialFormRef: RefObject<OrderFormState | null>
  itemDraftController: ItemDraftControllerApi
  itemInitialByClientId: Record<string, Item>
}

type OrderFormSubmitDeps = {
  saveOrder: ReturnType<typeof useOrderController>['saveOrder']
  createItemApi: ReturnType<typeof useCreateItem>
  updateItemApi: ReturnType<typeof useUpdateItem>
  deleteItemApi: ReturnType<typeof useDeleteItem>
  loadItemsByOrderId: ReturnType<typeof useItemFlow>['loadItemsByOrderId']
  validateOrderFields: ReturnType<typeof useOrderValidation>['validateOrderFields']
}

export const executeOrderFormSubmit = async (
  deps: OrderFormSubmitDeps,
  command: OrderFormSubmitCommand,
): Promise<OrderFormSubmitResult> => {
  const {
    mode,
    order,
    orderServerId,
    formState,
    validateForm,
    initialFormRef,
    itemDraftController,
    itemInitialByClientId,
  } = command
  const { saveOrder, createItemApi, updateItemApi, deleteItemApi, loadItemsByOrderId, validateOrderFields } =
    deps

  const isValid = validateForm()
  if (!isValid) {
    return { status: 'validation_error', message: 'Please fix the highlighted fields.' }
  }

  const initialForm = initialFormRef.current
  if (!initialForm) {
    return { status: 'dependency_error', message: 'Missing initial form snapshot.' }
  }

  const normalizedCurrent = normalizeFormStateForSave(formState)
  const normalizedInitial = normalizeFormStateForSave(initialForm)

  const orderChanges =
    mode === 'create'
      ? normalizedCurrent
      : getObjectDiff(normalizedInitial, normalizedCurrent)

  const createdItems = itemDraftController.getCreatedItems()
  const updatedItems = itemDraftController.getUpdatedItems()
  const deletedItemClientIds = itemDraftController.getDeletedItems()
  const hasItemChanges =
    createdItems.length > 0 ||
    updatedItems.length > 0 ||
    deletedItemClientIds.length > 0

  if (mode === 'edit' && !Object.keys(orderChanges).length && !hasItemChanges) {
    return { status: 'no_changes' }
  }

  try {
    if (mode === 'create') {
      const createItemsPayload = createdItems.map((item) => {
        const payloadItem = { ...item }
        const { order_id, id, ...fields } = payloadItem
        return fields
      })

      const createPayload = {
        ...orderChanges,
        items: createItemsPayload,
      } as OrderUpdateFields

      if (!validateOrderFields(createPayload)) {
        return { status: 'validation_error', message: 'Please check the form inputs.' }
      }

      const saved = await saveOrder({
        mode,
        clientId: order?.client_id,
        fields: createPayload,
      })

      if (!saved) {
        return { status: 'error', message: 'Unable to save order and items.' }
      }

      return { status: 'success_create' }
    }

    if (Object.keys(orderChanges).length > 0) {
      if (!validateOrderFields(orderChanges)) {
        return { status: 'validation_error', message: 'Please check the form inputs.' }
      }

      const orderSaved = await saveOrder({
        mode,
        clientId: order?.client_id,
        fields: orderChanges,
      })
      if (!orderSaved) {
        return { status: 'error', message: 'Unable to save order and items.' }
      }
    }

    if (hasItemChanges) {
      if (typeof orderServerId !== 'number') {
        return { status: 'dependency_error', message: 'Order id is required to save item changes.' }
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
          return { status: 'dependency_error', message: 'Unable to resolve item id for update.' }
        }

        await updateItemApi(updatePayload)
      }

      if (deletedItemClientIds.length > 0) {
        const targetIds = deletedItemClientIds
          .map((clientId) => itemInitialByClientId[clientId]?.id)
          .filter((id): id is number => typeof id === 'number')

        if (targetIds.length !== deletedItemClientIds.length) {
          return { status: 'dependency_error', message: 'Unable to resolve item id for deletion.' }
        }

        await deleteItemApi({ target_ids: targetIds })
      }

      await loadItemsByOrderId(orderServerId)
    }

    return { status: 'success_edit' }
  } catch (error) {
    console.error('Failed to save order form transaction', error)
    return { status: 'error', message: 'Unable to save order and items.' }
  }
}

export const useOrderFormSubmitController = () => {
  const { saveOrder } = useOrderController()
  const createItemApi = useCreateItem()
  const updateItemApi = useUpdateItem()
  const deleteItemApi = useDeleteItem()
  const { loadItemsByOrderId } = useItemFlow()
  const validation = useOrderValidation()

  const executeSubmit = (command: OrderFormSubmitCommand) =>
    executeOrderFormSubmit(
      {
        saveOrder,
        createItemApi,
        updateItemApi,
        deleteItemApi,
        loadItemsByOrderId,
        validateOrderFields: validation.validateOrderFields,
      },
      command,
    )

  return {
    executeSubmit,
  }
}
