import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'
import { useMessageManager } from '@/message_manager'

import { useGetOrderItems } from '../../item/api/item.api'
import { useOrderItemDraftController } from '../../item/hooks/useOrderItemDraftController'
import type { Item, ItemPopupPayload } from '../../item/types'
import { useOrderByClientId } from '../../hooks/useOrderSelectors'

import { OrderFormContextProvider } from './OrderForm.context'
import type { OrderFormPayload, OrderFormState } from './OrderForm.types'
import { buildInitialOrderForm } from './form/orderForm.factory'
import { mapItemsFromTable } from './form/orderForm.mappers'
import { useOrderFormWarnings } from './OrderForm.warnings'
import { useOrderFormValidation } from './OrderForm.validation'
import { useOrderFormSubmit } from './useOrderFormSubmit'
import { formatIsoDate } from '@/shared/utils/formatIsoDate'

export const OrderFormProvider = ({
  payload,
  children,
}: {
  payload?: OrderFormPayload
  children: ReactNode
}) => {
  const mode = payload?.mode ?? 'create'
  const order = useOrderByClientId(payload?.clientId ?? null)
  const orderServerId = order?.id ?? null
  const creationDate = formatIsoDate(order?.creation_date) ?? ''

  const getOrderItems = useGetOrderItems()
  const { showMessage } = useMessageManager()
  
  const draftOrderIdRef = useRef<number>(Date.now())
  const effectiveDraftOrderId = orderServerId ?? draftOrderIdRef.current
  const [initialItems, setInitialItems] = useState<Item[]>([])
  const [isLoadingInitialItems, setIsLoadingInitialItems] = useState(false)
  const [editorItem, setEditorItem] = useState<Item | null>(null)
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false)

  const [formState, setFormState] = useState<OrderFormState>(() =>
    buildInitialOrderForm({
      mode,
      order,
      deliveryPlanId: payload?.deliveryPlanId ?? null,
    }),
  )
  const warnings = useOrderFormWarnings()
  const initialFormRef = useRef<OrderFormState | null>(null)

  useEffect(() => {
    const initial = buildInitialOrderForm({
      mode,
      order,
      deliveryPlanId: payload?.deliveryPlanId ?? null,
    })
    setFormState(initial)
    makeInitialFormCopy(initialFormRef, initial)
  }, [mode, order, payload?.deliveryPlanId])

  useEffect(() => {
    let isActive = true

    const loadInitialItems = async () => {
      if (mode !== 'edit' || typeof orderServerId !== 'number') {
        setInitialItems([])
        setIsLoadingInitialItems(false)
        return
      }

      setIsLoadingInitialItems(true)
      try {
        const response = await getOrderItems(orderServerId)
        const payloadItems = response.data?.items

        if (!payloadItems) {
          showMessage({ status: 400, message: 'Missing items response.' })
          if (isActive) {
            setInitialItems([])
          }
          return
        }

        const normalized = mapItemsFromTable(payloadItems).map((item) => ({
          ...item,
          order_id: item.order_id ?? orderServerId,
        }))
        if (isActive) {
          setInitialItems(normalized)
        }
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load items.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        if (isActive) {
          setInitialItems([])
        }
      } finally {
        if (isActive) {
          setIsLoadingInitialItems(false)
        }
      }
    }

    void loadInitialItems()

    return () => {
      isActive = false
    }
  }, [getOrderItems, mode, orderServerId, showMessage])

  const itemInitialByClientId = useMemo(
    () =>
      initialItems.reduce<Record<string, Item>>((acc, item) => {
        acc[item.client_id] = item
        return acc
      }, {}),
    [initialItems],
  )

  const itemDraftController = useOrderItemDraftController({
    mode,
    initialItems,
  })
  const {
    visibleItems: visibleItemDrafts,
    createItem,
    updateItem,
    deleteItem,
    getCreatedItems,
    getUpdatedItems,
    getDeletedItems,
    reset: resetItemDrafts,
  } = itemDraftController

  const closeItemEditor = useCallback(() => {
    setEditorItem(null)
    setIsItemEditorOpen(false)
  }, [])

  const openItemCreateForm = useCallback(() => {
    setEditorItem(null)
    setIsItemEditorOpen(true)
  }, [])

  const openItemEditForm = useCallback((item: Item) => {
    setEditorItem(item)
    setIsItemEditorOpen(true)
  }, [])

  const itemEditorPayload = useMemo<ItemPopupPayload | undefined>(() => {
    if (!isItemEditorOpen) {
      return undefined
    }

    if (!editorItem) {
      return {
        mode: 'controlled',
        orderId: effectiveDraftOrderId,
        onSubmit: (draft) => {
          createItem({
            ...draft,
            order_id: draft.order_id ?? effectiveDraftOrderId,
          })
        },
      }
    }

    return {
      mode: 'controlled',
      orderId: effectiveDraftOrderId,
      initialItem: editorItem,
      onSubmit: (draft) => {
        updateItem(editorItem.client_id, {
          ...draft,
          id: draft.id ?? editorItem.id,
          client_id: editorItem.client_id,
          order_id: draft.order_id ?? editorItem.order_id ?? effectiveDraftOrderId,
        })
      },
      onDelete: (clientId) => {
        deleteItem(clientId)
      },
    }
  }, [createItem, deleteItem, editorItem, effectiveDraftOrderId, isItemEditorOpen, updateItem])

  const { validateForm } = useOrderFormValidation({ formState, warnings })

  const submitters = useOrderFormSubmit({
    mode,
    order,
    orderServerId,
    formState,
    validateForm,
    initialFormRef,
    itemDraftController: {
      getCreatedItems,
      getUpdatedItems,
      getDeletedItems,
      reset: resetItemDrafts,
    },
    itemInitialByClientId,
  })

  const value = useMemo(
    () => ({
      mode,
      order,
      creationDate,
      formState,
      setFormState,
      initialFormRef,
      warnings,
      visibleItemDrafts,
      itemInitialByClientId,
      isLoadingInitialItems,
      openItemCreateForm,
      openItemEditForm,
      isItemEditorOpen,
      itemEditorPayload,
      closeItemEditor,
      ...submitters,
    }),
    [
      formState,
      isLoadingInitialItems,
      itemInitialByClientId,
      mode,
      openItemCreateForm,
      openItemEditForm,
      isItemEditorOpen,
      itemEditorPayload,
      closeItemEditor,
      order,
      visibleItemDrafts,
      submitters,
      warnings,
    ],
  )

  return <OrderFormContextProvider value={value}>{children}</OrderFormContextProvider>
}
