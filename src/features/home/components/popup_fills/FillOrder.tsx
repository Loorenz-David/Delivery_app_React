import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { AddressPayload, OrderPayload } from '../../types/backend'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ApiError } from '../../../../lib/api/ApiClient'
import { OptionService, type ItemCategoryOption, type ItemPropertyOption, type ItemStateOption, type ItemStatePosition } from '../../api/optionServices'
import { CreateOrderService, UpdateOrderService, DeleteOrderService, DeleteItemService } from '../../api/deliveryService'
import type { OrderCreatePayload, OrderItemCreatePayload } from '../../api/deliveryService'

import { Field } from '../../../../components/forms/FieldContainer'
import { PhoneField, type PhoneValue } from '../../../../components/forms/PhoneField'
import { TextAreaField } from '../../../../components/forms/TextAreaField'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import InfoCard from '../../../../components/forms/InfoCard'
import { DropDown } from '../../../../components/buttons/DropDown'
import { AddressAutocomplete } from '../../../../google_maps/components/AddressAutocomplete'
import { fieldContainer, fieldInput } from '../../../../constants/classes'
import { apiClient } from '../../../../lib/api/ApiClient'
import { ItemCard } from '../section_cards/ItemCard'
import { OrderIcon } from '../../../../assets/icons'
import SendMessages from './SendMessages'
import { useHomeStore } from '../../../../store/home/useHomeStore'
import {
  applyCreatedItemIds,
  buildDraftItemCard,
  buildInitialItemSnapshotMap,
  buildOrderFromExisting,
  buildOrderItemCreatePayload,
  buildOrderPayloadFromState,
  buildOrderSnapshot,
  buildOrderUpdateFields,
  calculateNextItemSequence,
  computeNextDeliveryArrangement,
  convertOrderPayloadToFormState,
  createEmptyItem,
  createEmptyOrderState,
  getItemIdentifier,
  languageOptions,
  mergeOrderWithResponse,
  normalizeDraftLabelValue,
  resolveDefaultStateIds,
} from './utils/orderFormHelpers'
import { formBridge, type FormHandoffPayload } from '../../../../webrtc/formBridge'
import { PrintLabelButton } from './utils/PrintLabelButton'
import { normalizeDateKey } from '../../utils/timeFormat'
import type {
  CreatedItemResponse,
  DraftItem,
  DraftItemDimensions,
  ItemAction,
  ItemSnapshot,
  OrderFormState,
  OrderSnapshot,
} from './utils/orderFormHelpers'

type TabKey = 'customer' | 'addItem' | 'items' | 'messages'
type FillOrderMode = 'create' | 'edit'

interface FillOrderPayload {
  mode?: FillOrderMode
  orderId?: number
  routeId?: number
  itemId?: number
}

const TAB_CONFIG: Array<{ key: TabKey; label: string }> = [
  { key: 'customer', label: 'Customer Info' },
  { key: 'addItem', label: 'Add Items' },
  { key: 'items', label: 'Items' },
]

const FillOrder = ({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
  openConfirm,
  setIsLoading,
}: ActionComponentProps<FillOrderPayload>) => {
  const mode: FillOrderMode = payload?.mode ?? 'create'
  const optionService = useMemo(() => new OptionService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const createOrderService = useMemo(() => new CreateOrderService(), [])
  const updateOrderService = useMemo(() => new UpdateOrderService(), [])
  const deleteOrderService = useMemo(() => new DeleteOrderService(), [])
  const deleteItemService = useMemo(() => new DeleteItemService(), [])
  const routes = useHomeStore((state) => state.routes)
  const selectedRouteId = useHomeStore((state) => state.selectedRouteId)
  const selectedOrderId = useHomeStore((state) => state.selectedOrderId)
  const storeItemOptions = useHomeStore((state) => state.itemOptions)
  const itemStates = useHomeStore((state) => state.itemStates)
  const itemPositions = useHomeStore((state) => state.itemPositions)
  const { findOrderById } = useHomeStore.getState()
  const {
    findRouteById,
    selectRoute,
    selectOrder,
    appendOrderToRoute,
    replaceOrderInRoute,
    removeOrderFromRoute,
    setItemOptions,
  } = useHomeStore.getState()
  const { showMessage } = useMessageManager()
  const [activeTab, setActiveTab] = useState<TabKey>('customer')
  const [orderState, setOrderState] = useState<OrderFormState>(() => createEmptyOrderState())
  const [draftItem, setDraftItem] = useState<DraftItem>(() => createEmptyItem())
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemSequence, setItemSequence] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)
  const [isPrefilled, setIsPrefilled] = useState(mode !== 'edit')
  const [sendConfirmation, setSendConfirmation] = useState(false)
  const [templateSelection, setTemplateSelection] = useState<Partial<Record<'email' | 'sms', number>>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem('templatesForOrderCreation')
      return stored ? (JSON.parse(stored) as Partial<Record<'email' | 'sms', number>>) : {}
    } catch (error) {
      console.error('Failed to read stored templates', error)
      return {}
    }
  })
  useEffect(() => {
    if (!sendConfirmation && activeTab === 'messages') {
      setActiveTab('customer')
    }
  }, [activeTab, sendConfirmation])
  const itemOptions = storeItemOptions ?? null
  const resolvedRouteId =
    typeof payload?.routeId === 'number'
      ? payload.routeId
      : selectedRouteId ?? null
  const targetRoute = resolvedRouteId != null ? findRouteById(resolvedRouteId) : null
  const targetRouteId = targetRoute?.id ?? resolvedRouteId ?? null
  const resolvedOrderId =
    typeof payload?.orderId === 'number'
      ? payload.orderId
      : selectedOrderId ?? null
  const locatedOrder = resolvedOrderId != null ? findOrderById(resolvedOrderId, targetRouteId) : null
  const isEditMode = mode === 'edit'
  const initialOrderSnapshotRef = useRef<OrderSnapshot | null>(null)
  const initialItemsSnapshotRef = useRef<Record<number, ItemSnapshot>>({})
  const hasAppliedItemPrefillRef = useRef(false)
  const editingOrderRef = useRef<OrderPayload | null>(null)
  const hasPendingChanges = useMemo(() => {
    if (!isEditMode) {
      return false
    }
    const updates = buildOrderUpdateFields(
      initialOrderSnapshotRef.current,
      orderState,
      initialItemsSnapshotRef.current,
    )
    return Boolean(updates && Object.keys(updates).length > 0)
  }, [isEditMode, orderState])

  const headerContent = useMemo(
    () => <FillOrderHeader mode={mode} />,
    [mode],
  )
  const visibleItemCount = useMemo(
    () => orderState.delivery_items.filter((item) => item.action !== 'delete').length,
    [orderState.delivery_items],
  )
  const printableOrders = useMemo(() => {
    const fallbackOrderId = locatedOrder?.id ?? Date.now()
    const deliveryArrangement = computeNextDeliveryArrangement(targetRoute)
    const deliveryDate = normalizeDateKey(targetRoute?.delivery_date)
    return [
      buildOrderPayloadFromState(orderState, {
        routeId: targetRouteId ?? undefined,
        fallbackOrderId,
        deliveryArrangement,
        senderId: apiClient.getSessionUserId(),
        deliveryDate,
      }),
    ]
  }, [locatedOrder?.id, orderState, targetRoute?.delivery_date, targetRouteId])

  const tabs = useMemo<Array<{ key: TabKey; label: string }>>(() => {
    const itemsLabel = visibleItemCount > 0 ? `Items (${visibleItemCount})` : 'Items'
    const baseTabs = [
      TAB_CONFIG[0],
      TAB_CONFIG[1],
      { key: 'items', label: itemsLabel } as const,
    ]
    return sendConfirmation ? [...baseTabs, { key: 'messages', label: 'Messages' }] : baseTabs
  }, [sendConfirmation, visibleItemCount])

  const itemFormValid = Boolean(
    draftItem.article_number.trim() &&
    normalizeDraftLabelValue(draftItem.item_category).trim() &&
    normalizeDraftLabelValue(draftItem.item_type).trim() &&
    typeof draftItem.weight === 'number' &&
    !Number.isNaN(draftItem.weight),
  )

  const handleItemSubmit = () => {
    if (!itemFormValid) {
      return
    }
    const resolvedFrontId =
      editingItemIndex != null
        ? orderState.delivery_items[editingItemIndex]?.front_end_id ??
          orderState.delivery_items[editingItemIndex]?.id ??
          itemSequence
        : itemSequence
    const nextAction: ItemAction | undefined = isEditMode ? (draftItem.id ? 'update' : 'create') : undefined
    const payloadItem: DraftItem = {
      ...draftItem,
      front_end_id: resolvedFrontId,
      properties: { ...draftItem.properties },
      action: nextAction,
    }

    setOrderState((prev) => {
      const nextItems = [...prev.delivery_items]
      if (editingItemIndex != null) {
        nextItems[editingItemIndex] = payloadItem
      } else {
        nextItems.push(payloadItem)
      }
      return {
        ...prev,
        delivery_items: nextItems,
      }
    })

    if (editingItemIndex == null) {
      setItemSequence((prev) => prev + 1)
    }

    setEditingItemIndex(null)
    const nextDefaults = resolveDefaultStateIds(
      {
        ...createEmptyItem(),
        item_state_id: payloadItem.item_state_id ?? null,
        item_position_id: payloadItem.item_position_id ?? null,
      },
      itemStates,
      itemPositions,
    )
    setDraftItem(nextDefaults)
    setActiveTab('items')
  }

  const handleEditItem = useCallback((itemId: number) => {
    const index = orderState.delivery_items.findIndex((entry) => getItemIdentifier(entry) === itemId || entry.id === itemId)
    if (index === -1) {
      return
    }
    const selected = orderState.delivery_items[index]
    const resolvedCategory =
      itemOptions?.find((category) => category.name === selected.item_category) ?? null
    const resolvedType =
      resolvedCategory?.item_types.find((type) => type.name === selected.item_type) ??
      itemOptions?.flatMap((category) => category.item_types).find((type) => type.name === selected.item_type) ??
      null
    setDraftItem({
      ...selected,
      item_category: resolvedCategory?.name ?? selected.item_category,
      item_type: resolvedType?.name ?? selected.item_type,
      dimensions: { ...selected.dimensions },
      properties: { ...(selected.properties ?? {}) },
      action: selected.action,
    })
    setEditingItemIndex(index)
    setActiveTab('addItem')
  }, [itemOptions, orderState.delivery_items])

  const performDeleteItem = useCallback(
    async (itemId: number) => {
      const targetItem = orderState.delivery_items.find(
        (item) => getItemIdentifier(item) === itemId || item.id === itemId,
      )
      if (!targetItem) {
        return
      }

      // For persisted items in edit mode, call backend delete
      if (isEditMode && targetItem.id) {
        try {
          const response = await deleteItemService.deleteItem({ id: targetItem.id })
          const nextItems = orderState.delivery_items.filter(
            (item) => getItemIdentifier(item) !== itemId && item.id !== targetItem.id,
          )
          const nextState: OrderFormState = {
            ...orderState,
            delivery_items: nextItems,
          }
          setOrderState(nextState)
          const nextOrderPayload = buildOrderFromExisting(editingOrderRef.current, nextState)
          editingOrderRef.current = nextOrderPayload
          if (targetRouteId != null) {
            replaceOrderInRoute(targetRouteId, nextOrderPayload)
          }
          initialItemsSnapshotRef.current = buildInitialItemSnapshotMap(nextOrderPayload.delivery_items)
          initialOrderSnapshotRef.current = buildOrderSnapshot(convertOrderPayloadToFormState(nextOrderPayload))
          showMessage({
            status: response.status ?? 200,
            message: response.message ?? 'Item deleted successfully.',
          })
        } catch (error) {
          const status = error instanceof ApiError ? error.status : 500
          const message =
            error instanceof ApiError && error.message
              ? error.message
              : 'Failed to delete the item. Please try again.'
          showMessage({ status, message })
        }
      } else {
        // For draft items, simply remove locally
        setOrderState((prev) => ({
          ...prev,
          delivery_items: prev.delivery_items.filter(
            (item) => getItemIdentifier(item) !== itemId && item.id !== targetItem.id,
          ),
        }))
      }

      if (editingItemIndex != null) {
        setEditingItemIndex(null)
        setDraftItem(createEmptyItem())
      }
    },
    [
      deleteItemService,
      editingItemIndex,
      isEditMode,
      orderState,
      replaceOrderInRoute,
      showMessage,
      targetRouteId,
    ],
  )

  const handleDeleteItem = useCallback(
    (itemId: number) => {
      if (openConfirm) {
        openConfirm({
          message: 'Delete this item? This action cannot be undone.',
          onConfirm: () => performDeleteItem(itemId),
          confirmLabel: 'Delete Item',
          cancelLabel: 'Cancel',
        })
        return
      }
      void performDeleteItem(itemId)
    },
    [openConfirm, performDeleteItem],
  )

  const handleToggleSendConfirmation = useCallback(() => {
    setSendConfirmation((prev) => !prev)
  }, [])

  const persistTemplateSelection = useCallback((selection: Partial<Record<'email' | 'sms', number>>) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('templatesForOrderCreation', JSON.stringify(selection))
      }
    } catch (error) {
      console.error('Failed to persist template selection', error)
    }
  }, [])

  const handleTemplatesSelected = useCallback(
    (selection: Partial<Record<'email' | 'sms', number>>) => {
      setTemplateSelection(selection)
      setSendConfirmation(true)
      persistTemplateSelection(selection)
      setActiveTab('customer')
      showMessage({ status: 'success', message: 'Templates selected for order creation.' })
    },
    [persistTemplateSelection, showMessage],
  )

  const openTemplateSelector = useCallback(() => {
    setSendConfirmation(true)
    setActiveTab('messages')
  }, [])

  const handleOrderSubmit = useCallback(async (): Promise<void> => {
    
    if (isSubmitting) {
      return
    }

    if (!targetRoute || targetRouteId == null) {
      showMessage({ status: 400, message: 'Please open a route before continuing.' })
      return
    }

    if (!orderState.client_address) {
      showMessage({ status: 400, message: 'Please provide the customer address.' })
      setActiveTab('customer')
      return
    }

    if (!orderState.first_name.trim() || !orderState.last_name.trim()) {
      showMessage({ status: 400, message: 'Customer name is required.' })
      setActiveTab('customer')
      return
    }

    if (!String(orderState.primary_phone?.number || '').trim()) {
      showMessage({ status: 400, message: 'Please provide a primary phone number.' })
      setActiveTab('customer')
      return
    }

    if (!orderState.client_email.trim()) {
      showMessage({ status: 400, message: 'Please provide the client email.' })
      setActiveTab('customer')
      return
    }

    if (orderState.delivery_items.filter((item) => item.action !== 'delete').length === 0) {
      showMessage({ status: 400, message: 'Add at least one item before submitting the order.' })
      setActiveTab('addItem')
      return
    }
    if (mode === 'create' && sendConfirmation && Object.keys(templateSelection).length === 0) {
      showMessage({ status: 400, message: 'Select at least one message template before sending confirmations.' })
      setActiveTab('messages')
      return
    }
    
    if (isEditMode) {
      if (!payload?.orderId) {
        showMessage({ status: 400, message: 'Order identifier is missing.' })
        return
      }
      const updateFields = buildOrderUpdateFields(
        initialOrderSnapshotRef.current,
        orderState,
        initialItemsSnapshotRef.current,
      )
      if (!updateFields || Object.keys(updateFields).length === 0) {
        showMessage({ status: 'info', message: 'No changes detected.' })
        return
      }
      setIsLoading(true)
      setIsSubmitting(true)

      try {

        const response = await updateOrderService.updateOrder({
          id: payload.orderId,
          fields: updateFields,
        })

        const responseData = response.data as Record<string, unknown> | undefined
        const createdItemsRaw = responseData?.['created_items']
        const createdItemsInfo = Array.isArray(createdItemsRaw)
          ? (createdItemsRaw as CreatedItemResponse[])
          : []
        const normalizedItems = applyCreatedItemIds(orderState.delivery_items, createdItemsInfo)
        const updatedState: OrderFormState = {
          ...orderState,
          delivery_items: normalizedItems,
        }
        const fallbackOrder = buildOrderFromExisting(editingOrderRef.current, updatedState)
        setOrderState(updatedState)
        if (targetRouteId != null) {
          replaceOrderInRoute(targetRouteId, fallbackOrder)
          selectOrder(fallbackOrder.id, { routeId: targetRouteId })
        }
        editingOrderRef.current = fallbackOrder
        initialItemsSnapshotRef.current = buildInitialItemSnapshotMap(fallbackOrder.delivery_items)
        initialOrderSnapshotRef.current = buildOrderSnapshot(convertOrderPayloadToFormState(fallbackOrder))
        
        showMessage({
          status: response.status ?? 200,
          message: response.message ?? 'Order updated successfully.',
        })
        onClose?.()
      } catch (error) {
        console.log(error)
        const status = error instanceof ApiError ? error.status : 500
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : 'Failed to update the order. Please try again.'
        showMessage({ status, message })
      } finally {
        setIsSubmitting(false)
        setIsLoading(false)
      }
      return
    }

    const deliveryArrangement = computeNextDeliveryArrangement(targetRoute)
    const normalizedSecondaryPhone = orderState.secondary_phone.number.trim() ? orderState.secondary_phone : null
    const currentUserId = apiClient.getSessionUserId()
    // notes chat on create not supported by payload typing
    const sanitizedItems = orderState.delivery_items.filter((item) => item.action !== 'delete').map((item) => {
      const baseItemPayload = buildOrderItemCreatePayload(item)
      return responseManager.sanitizePayload<OrderItemCreatePayload>(baseItemPayload)
    }) as OrderItemCreatePayload[]

    

    const payloadCreate = responseManager.sanitizePayload<OrderCreatePayload>({
      route_id: targetRouteId,
      delivery_arrangement: deliveryArrangement,
      client_first_name: orderState.first_name.trim(),
      client_last_name: orderState.last_name.trim(),
      client_email: orderState.client_email.trim(),
      client_primary_phone: {
        prefix: orderState.primary_phone.prefix,
        number: orderState.primary_phone.number.trim(),
      },
      client_secondary_phone: normalizedSecondaryPhone,
      client_address: orderState.client_address,
      client_language: orderState.client_language,
      delivery_after: orderState.delivery_after,
      delivery_before: orderState.delivery_before,
      delivery_items: sanitizedItems,
      message_template:
        sendConfirmation && Object.keys(templateSelection).length > 0 ? templateSelection : undefined,
    }) as OrderCreatePayload

    setIsLoading(true)
    setIsSubmitting(true)
    try {

      const response = await createOrderService.createOrder(payloadCreate)
      const responsePayload = (response.data as Record<string, unknown> | undefined)?.['data'] ?? response.data
      const resolvedOrder = responseManager.resolveEntityFromResponse<Partial<OrderPayload>>(responsePayload)
      const fallbackOrder = buildOrderPayloadFromState(orderState, {
        routeId: targetRouteId,
        fallbackOrderId: typeof resolvedOrder?.id === 'number' ? resolvedOrder.id : undefined,
        deliveryArrangement,
        senderId: currentUserId,
      })
      const mergedOrder = mergeOrderWithResponse(fallbackOrder, resolvedOrder)
      if (targetRouteId != null) {
        appendOrderToRoute(targetRouteId, mergedOrder)
        selectRoute(targetRouteId, { routeId: targetRouteId })
        selectOrder(mergedOrder.id, { routeId: targetRouteId })
      }
      showMessage({
        status: response.status ?? 200,
        message: response.message ?? 'Order created successfully.',
      })
      const messageStatus = (responsePayload as Record<string, any> | undefined)?.message_status
      if (messageStatus) {
        if (messageStatus.error) {
          showMessage({
            status: 'warning',
            message: `Order created. Message delivery error: ${messageStatus.error.slice(0,40)}`,
            details: messageStatus.error,
            messageDuration: 12000,
          })
        }
        const emailFail = messageStatus.email?.fail_emails?.length ?? 0
        const smsFail = messageStatus.sms?.fail_sms?.length ?? 0
        if (emailFail || smsFail) {
          showMessage({
            status: 'info',
            message: `Messages sent with ${emailFail} email fail(s) and ${smsFail} sms fail(s).`,
            messageDuration: 15000,
          })
        }
      }
      setOrderState(createEmptyOrderState())
      setDraftItem(createEmptyItem())
      setItemSequence(1)
      setEditingItemIndex(null)
      setActiveTab('customer')
      onClose?.()
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : 'Failed to submit the order. Please try again.'
      showMessage({ status, message })
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [
    createOrderService,
    initialItemsSnapshotRef,
    initialOrderSnapshotRef,
    isEditMode,
    isSubmitting,
    onClose,
    orderState,
    payload?.orderId,
    replaceOrderInRoute,
    appendOrderToRoute,
    responseManager,
    setActiveTab,
    setDraftItem,
    setIsLoading,
    selectOrder,
    selectRoute,
    showMessage,
    sendConfirmation,
    templateSelection,
    targetRoute,
    targetRouteId,
    updateOrderService,
  ])

  const performDeleteOrder = useCallback(async () => {
    if (!isEditMode || !payload?.orderId || !targetRouteId) {
      showMessage({ status: 400, message: 'Order identifier is missing.' })
      return
    }
    if (isDeletingOrder) {
      return
    }
    setIsDeletingOrder(true)
    setIsLoading(true)
    try {
      const response = await deleteOrderService.deleteOrder({ id: payload.orderId })
      if (targetRouteId != null) {
        removeOrderFromRoute(targetRouteId, payload.orderId)
      }
      selectOrder(null)
      showMessage({
        status: response.status ?? 200,
        message: response.message ?? 'Order deleted successfully.',
      })
      onClose?.()
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const message =
        error instanceof ApiError && error.message ? error.message : 'Failed to delete the order.'
      showMessage({ status, message })
    } finally {
      setIsDeletingOrder(false)
      setIsLoading(false)
    }
  }, [
    deleteOrderService,
    isDeletingOrder,
    isEditMode,
    onClose,
    payload?.orderId,
    removeOrderFromRoute,
    selectOrder,
    setIsLoading,
    showMessage,
    targetRouteId,
  ])

  const handleDeleteOrder = useCallback(() => {
    if (!openConfirm) {
      void performDeleteOrder()
      return
    }
    openConfirm({
      message: 'Deleting this order will also delete all items within it. This action cannot be undone. Continue?',
      onConfirm: performDeleteOrder,
      confirmLabel: 'Delete Order',
      cancelLabel: 'Cancel',
    })
  }, [openConfirm, performDeleteOrder])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'customer':
        return (
          <CustomerInfoTab
            state={orderState}
            setState={setOrderState}
            mode={mode}
            onSubmit={handleOrderSubmit}
            isSubmitting={isSubmitting}
            onDelete={handleDeleteOrder}
            showDelete={isEditMode}
            isDeleting={isDeletingOrder}
            sendConfirmation={sendConfirmation}
            onToggleSendConfirmation={handleToggleSendConfirmation}
            onOpenTemplateSelector={openTemplateSelector}
            templateSelection={templateSelection}
            printableOrders={printableOrders}
          />
        )
      case 'addItem':
        return (
          <ItemFormTab
            draftItem={draftItem}
            setDraftItem={setDraftItem}
            editingIndex={editingItemIndex}
            onSubmit={handleItemSubmit}
            isValid={itemFormValid}
            itemOptions={itemOptions}
            itemStates={itemStates}
            itemPositions={itemPositions}
          />
        )
      case 'items':
        return (
          <div className="space-y-4">
            <ItemsListTab
              items={orderState.delivery_items}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
            {isEditMode ? (
              <div className="flex justify-end border-t border-[var(--color-border)] pt-4">
                <BasicButton
                  params={{
                    variant: 'primary',
                    disabled: isSubmitting,
                    onClick: handleOrderSubmit,
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </BasicButton>
              </div>
            ) : null}
          </div>
        )
      case 'messages':
        return (
          <SendMessages
            selectionMode
            payload={{}}
            onClose={onClose}
            onTemplatesSelected={handleTemplatesSelected}
            onCloseSelection={() => setActiveTab('customer')}
            initialTemplateSelection={templateSelection}
          />
        )
      default:
        return null
    }
  }

    useEffect(() => {
    setPopupHeader?.(headerContent)
    return () => setPopupHeader?.(null)
  }, [headerContent, setPopupHeader])

  useEffect(() => {
    setDraftItem((prev) => resolveDefaultStateIds(prev, itemStates, itemPositions))
  }, [itemStates, itemPositions])

  const hasFetchedItemOptionsRef = useRef(false)
  useEffect(() => {
    let cancelled = false
    if (hasFetchedItemOptionsRef.current || (itemOptions && itemOptions.length > 0)) {
      return
    }
    hasFetchedItemOptionsRef.current = true
    ;(async () => {
      try {
        const data = await optionService.fetchItemOptions()

        if (cancelled) {
          return
        }
        setItemOptions(data ?? [])
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch item options', error)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [itemOptions, optionService, setItemOptions])

  useEffect(() => {
    if (!registerBeforeClose) {
      return
    }
    registerBeforeClose({
      shouldWarn: () => isEditMode && hasPendingChanges && !isSubmitting,
      onSave: handleOrderSubmit,
      message: 'You have unsaved changes. Would you like to save before closing?',
      saveLabel: 'Save',
      discardLabel: 'Discard',
    })
    return () => registerBeforeClose(undefined)
  }, [handleOrderSubmit, hasPendingChanges, isEditMode, isSubmitting, registerBeforeClose])

  useEffect(() => {
    if (!isEditMode || isPrefilled) {
      return
    }
    const orderId = resolvedOrderId
    let orderToUse: OrderPayload | null = locatedOrder ?? null

    if (!orderToUse && orderId != null) {
      for (const route of routes) {
        const match = route.delivery_orders?.find((order) => order.id === orderId)
        if (match) {
          orderToUse = match
          break
        }
      }
    }

    if (!orderToUse) {
      return
    }

    const preparedState = convertOrderPayloadToFormState(orderToUse)
    editingOrderRef.current = orderToUse
    initialOrderSnapshotRef.current = buildOrderSnapshot(preparedState)
    initialItemsSnapshotRef.current = buildInitialItemSnapshotMap(orderToUse.delivery_items)
    setOrderState(preparedState)
    setItemSequence(calculateNextItemSequence(preparedState.delivery_items))
    setIsPrefilled(true)
    if (orderToUse.route_id) {
      selectRoute(orderToUse.route_id, { routeId: orderToUse.route_id })
      selectOrder(orderToUse.id, { routeId: orderToUse.route_id })
    }
  }, [isEditMode, isPrefilled, locatedOrder, resolvedOrderId, routes, selectOrder, selectRoute])

  useEffect(() => {
    if (!isEditMode || !payload?.itemId) {
      return
    }
    if (!isPrefilled) {
      return
    }
    if (hasAppliedItemPrefillRef.current) {
      return
    }
    const identifier = payload.itemId
    const targetItem = orderState.delivery_items.find(
      (item) => getItemIdentifier(item) === identifier || item.id === identifier,
    )
    if (!targetItem) {
      return
    }
    hasAppliedItemPrefillRef.current = true
    setActiveTab('addItem')
    handleEditItem(getItemIdentifier(targetItem))
  }, [handleEditItem, isEditMode, isPrefilled, orderState.delivery_items, payload?.itemId, setActiveTab])


  if (isEditMode && !isPrefilled) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading order details...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full  flex-col">
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-1">{renderTabContent()}</div>
    </div>
  )
}

export default FillOrder

function FillOrderHeader({ mode }: { mode: FillOrderMode }) {
  const title = mode === 'edit' ? 'Update Order' : 'Create New Order'
  const subtitle =
    mode === 'edit'
      ? 'Update the customer details and review existing items.'
      : 'Provide the customer info and start adding items.'

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)]  text-[var(--color-primary)]">
        <div className="relative flex items-center justify-center">
          <OrderIcon className="app-icon h-5 w-5 text-[var(--color-primary)]" />
          
        </div>
      </span>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-sm text-[var(--color-muted)]">{subtitle}</p>
      </div>
    </div>
  )
}

interface CustomerInfoTabProps {
  state: OrderFormState
  setState: Dispatch<SetStateAction<OrderFormState>>
  mode: FillOrderMode
  onSubmit: () => void | Promise<void>
  isSubmitting: boolean
  onDelete?: () => void
  showDelete?: boolean
  isDeleting?: boolean
  sendConfirmation: boolean
  onToggleSendConfirmation: () => void
  onOpenTemplateSelector: () => void
  templateSelection: Partial<Record<'email' | 'sms', number>>
  printableOrders: OrderPayload[]
}

const buildHandoffPayloadFromOrder = (state: OrderFormState): FormHandoffPayload => ({
  client_first_name: state.first_name,
  client_second_name: state.last_name,
  client_email: state.client_email,
  client_primary_phone: state.primary_phone,
  client_secondary_phone: state.secondary_phone?.number.trim() ? state.secondary_phone : undefined,
  client_address: state.client_address,
  open_form: true,
})

const applyFormResponseToOrderState = (prev: OrderFormState, payload: FormHandoffPayload): OrderFormState => {
  const mergePhone = (current: PhoneValue, incoming?: PhoneValue): PhoneValue =>
    incoming
      ? {
          prefix: incoming.prefix ?? current.prefix,
          number: incoming.number ?? current.number,
        }
      : current

  return {
    ...prev,
    first_name: payload.client_first_name ?? prev.first_name,
    last_name: payload.client_second_name ?? prev.last_name,
    client_email: payload.client_email ?? prev.client_email,
    primary_phone: mergePhone(prev.primary_phone, payload.client_primary_phone),
    secondary_phone: mergePhone(prev.secondary_phone, payload.client_secondary_phone),
    client_address: payload.client_address ?? prev.client_address,
    note: payload.note ?? prev.note
  }
}

function CustomerInfoTab({
  state,
  setState,
  mode,
  onSubmit,
  isSubmitting,
  onDelete,
  showDelete = false,
  isDeleting = false,
  sendConfirmation,
  onToggleSendConfirmation,
  onOpenTemplateSelector,
  templateSelection,
  printableOrders,
}: CustomerInfoTabProps) {
  const { showMessage } = useMessageManager()
  const [bridgeStatus, setBridgeStatus] = useState(formBridge.getStatus())
  const [bridgeError, setBridgeError] = useState<string | null>(formBridge.getLastError())

  useEffect(() => {
    formBridge.ensureConnection({ initiate: false })
    const unsubStatus = formBridge.onStatusChange((status, error) => {
      setBridgeStatus(status)
      setBridgeError(error ?? null)
    })
    const unsubMessage = formBridge.onMessage((message) => {
      console.log('Received form message', message.payload)
      if (message.type === 'form-response') {
        setState((prev) => applyFormResponseToOrderState(prev, message.payload))
        showMessage({
          status: 200,
          message: 'Form received from the linked device.',
        })
      }
    })

    return () => {
      unsubStatus()
      unsubMessage()
    }
  }, [setState, showMessage])

  const handleLanguageChange = (value?: string) => {
    if (!value) return
    setState((prev) => ({ ...prev, client_language: value }))
  }
  const handleNameChange = (field: 'first_name' | 'last_name') => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setState((prev) => ({ ...prev, [field]: value }))
  }
  const handlePhoneChange = (field: 'primary_phone' | 'secondary_phone') => (value: PhoneValue) => {
    setState((prev) => ({
      ...prev,
      [field]: {
        prefix: String(value.prefix ?? ''),
        number: String(value.number ?? ''), // force string
      },
    }))
  }
  const handleAddressSelected = (address: AddressPayload) => {
    setState((prev) => ({ ...prev, client_address: address }))
  }
  const handleAddressCleared = () => {
    setState((prev) => ({ ...prev, client_address: null }))
  }
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setState((prev) => ({ ...prev, client_email: value }))
  }
  const handleDeliveryTimeChange = (field: 'delivery_after' | 'delivery_before') => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setState((prev) => ({ ...prev, [field]: value }))
  }
 

  const handleSendFormToDevice = () => {
    const payload = buildHandoffPayloadFromOrder(state)
    const success = formBridge.sendFormRequest(payload)
    console.log('Success:', success)
    showMessage({
      status: success ? 200 : 'warning',
      message: success ? 'Form sent to linked device.' : 'Unable to send form. Connection not ready.',
    })
  }

  return (
    <div className="space-y-5">
      <InfoCard
        title="Share form to another device"
        description="Send this customer form to your linked device for them to fill and send back."
      >
        <p className="text-xs font-semibold text-[var(--color-text)]">
          Status: {bridgeStatus} {bridgeError ? <span className="text-red-600">({bridgeError})</span> : null}
        </p>
        <BasicButton
          params={{
            variant: 'primary',
            onClick: handleSendFormToDevice,
            disabled: bridgeStatus !== 'connected',
          }}
        >
          Send form
        </BasicButton>
      </InfoCard>

      <Field label="Client Language" required>
        <DropDown
          buttonClassName="gap-2 items-center justify-between"
          options={languageOptions}
          className={fieldContainer}
          state={[state.client_language, (value) => handleLanguageChange(value as string)]}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First Name" required>
          <div className={fieldContainer}>
            <input className={fieldInput} value={state.first_name} onChange={handleNameChange('first_name')} />
          </div>
        </Field>
        <Field label="Last Name" required>
          <div className={fieldContainer}>
            <input className={fieldInput} value={state.last_name} onChange={handleNameChange('last_name')} />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PhoneField
          label="Primary Phone"
          value={state.primary_phone}
          onChange={handlePhoneChange('primary_phone')}
          required
        />
        <PhoneField
          label="Secondary Phone (optional)"
          value={state.secondary_phone}
          onChange={handlePhoneChange('secondary_phone')}
        />
      </div>

      <Field label="Email" required>
        <div className={fieldContainer}>
          <input
            type="email"
            className={fieldInput}
            value={state.client_email}
            onChange={handleEmailChange}
            required
            autoComplete="email"
            placeholder="client@example.com"
          />
        </div>
      </Field>

      <Field label="Client Address" required>
        <AddressAutocomplete
          placeholder="Search client address"
          existingAddress={state.client_address}
          onAddressSelected={handleAddressSelected}
          onAddressCleared={handleAddressCleared}
          enableManualPicker
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Delivery After">
          <div className={fieldContainer}>
            <input type="time" className={fieldInput} value={state.delivery_after} onChange={handleDeliveryTimeChange('delivery_after')} />
          </div>
        </Field>
        <Field label="Delivery Before">
          <div className={fieldContainer}>
            <input type="time" className={fieldInput} value={state.delivery_before} onChange={handleDeliveryTimeChange('delivery_before')} />
          </div>
        </Field>
      </div>

      {mode === 'create' ? (
        <Field label="Customer Notes (optional)">
          <TextAreaField
            placeholder="Anything else the customer wants to share..."
            value={state.note}
            onChange={(event) => setState((prev) => ({ ...prev, note: event.target.value }))}
            rows={3}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Notes will be sent as chat entries in the order (not required).
          </p>
        </Field>
      ) : null}

      
      {mode === 'create' ? (
        <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={sendConfirmation}
            onChange={onToggleSendConfirmation}
            className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)]"
          />
          <button type="button" className="cursor-pointer text-[var(--color-primary)] hover:underline" onClick={onOpenTemplateSelector}>
            Send confirmation message
          </button>
          <span className="text-xs text-[var(--color-muted)]">
            {templateSelection.email || templateSelection.sms
              ? `Selected: ${[
                  templateSelection.email ? `Email #${templateSelection.email}` : null,
                  templateSelection.sms ? `SMS #${templateSelection.sms}` : null,
                ]
                  .filter(Boolean)
                  .join(', ')}`
              : 'No templates selected'}
          </span>
        </div>
      ) : null}

      <InfoCard
        title="Create labels."
        description="Select a template for creating a label with the order's information"
      >
        <PrintLabelButton orders={printableOrders} />
      </InfoCard>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 gap-3">
        {showDelete ? (
          <BasicButton
            params={{
              variant: 'ghost',
              className: 'text-red-600 hover:text-red-700',
              onClick: onDelete,
              disabled: isDeleting || isSubmitting,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Order'}
          </BasicButton>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          
          <BasicButton
            params={{
              variant: 'primary',
              disabled: isSubmitting,
              onClick: onSubmit,
            }}
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Order' : 'Create Order'}
          </BasicButton>
        </div>
      </div>
    </div>
  )
}

interface ItemFormTabProps {
  draftItem: DraftItem
  setDraftItem: Dispatch<SetStateAction<DraftItem>>
  editingIndex: number | null
  onSubmit: () => void
  isValid: boolean
  itemOptions: ItemCategoryOption[] | null
  itemStates: ItemStateOption[]
  itemPositions: ItemStatePosition[]
}

function ItemFormTab({ draftItem, setDraftItem, editingIndex, onSubmit, isValid, itemOptions, itemStates, itemPositions }: ItemFormTabProps) {
  const selectedCategory =
    itemOptions?.find((category) => category.name === draftItem.item_category) ?? null
  const availableTypes = selectedCategory?.item_types ?? []
  const selectedType =
    availableTypes.find((type) => type.name === draftItem.item_type) ?? null

  const handleFieldChange = (field: keyof DraftItem) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setDraftItem((prev) => {
      if (field === 'weight' || field === 'item_valuation') {
        const numericValue = value === '' ? null : Number(value)
        const normalizedValue = numericValue == null || Number.isNaN(numericValue) ? null : numericValue
        return {
          ...prev,
          [field]: normalizedValue,
        } as DraftItem
      }
      return {
        ...prev,
        [field]: value,
      } as DraftItem
    })
  }

  const handleDimensionChange = (field: keyof DraftItemDimensions) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setDraftItem((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: value,
      },
    }))
  }

  const handleCategoryChange = (value?: string | number) => {
    if (value == null) {
      setDraftItem((prev) => ({
        ...prev,
        item_category: '',
        item_type: '',
        properties: {},
      }))
      return
    }
    const stringValue = String(value)
    const category = itemOptions?.find((entry) => entry.name === stringValue)
    setDraftItem((prev) => ({
      ...prev,
      item_category: category?.name ?? stringValue,
      item_type: '',
      properties: {},
    }))
  }

  const handleTypeChange = (value?: string | number) => {
    if (value == null) {
      setDraftItem((prev) => ({
        ...prev,
        item_type: '',
        properties: {},
      }))
      return
    }
    const stringValue = String(value)
    const type = availableTypes.find((entry) => entry.name === stringValue)
    setDraftItem((prev) => ({
      ...prev,
      item_type: type?.name ?? stringValue,
      properties: {},
    }))
  }

  const handlePropertyChange = (propertyKey: string, value: string) => {
    setDraftItem((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propertyKey]: value,
      },
    }))
  }

  return (
    <div className="space-y-5">
      <Field label="Article Number" required>
        <div className={fieldContainer}>
          <input className={fieldInput} value={draftItem.article_number} onChange={handleFieldChange('article_number')} />
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Item Category" required>
          <DropDown
            buttonClassName="gap-2 items-center justify-between"
            options={(itemOptions ?? []).map((category) => ({
              value: category.name,
              display: category.name,
            }))}
            className={fieldContainer}
            state={[draftItem.item_category || undefined, (value) => handleCategoryChange(value as string)]}
            placeholder={itemOptions ? 'Select a category' : 'Loading...'}
          />
        </Field>
        <Field label="Item Type" required>
          <DropDown
            buttonClassName="gap-2 items-center justify-between"
            options={availableTypes.map((type) => ({
              value: type.name,
              display: type.name,
            }))}
            className={fieldContainer}
            state={[draftItem.item_type || undefined, (value) => handleTypeChange(value as string)]}
            placeholder={selectedCategory ? 'Select a type' : 'Select a category first'}
          />
        </Field>
      </div>
      
      {selectedType?.properties?.length ? (
        <div className="space-y-4">
          {selectedType.properties.map((property) => (
            <PropertyField
              key={property.id}
              property={property}
              value={resolveDraftPropertyValue(draftItem.properties, property)}
              onChange={(value) => handlePropertyChange(property.name ?? String(property.id), value)}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Item Valuation">
          <div className={fieldContainer}>
            <input
              type="number"
              className={fieldInput}
              value={draftItem.item_valuation ?? ''}
              onChange={handleFieldChange('item_valuation')}
            />
          </div>
        </Field>
        <Field label="Page Link">
          <div className={fieldContainer}>
            <input className={fieldInput} value={draftItem.page_link} onChange={handleFieldChange('page_link')} />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Width (cm)">
          <div className={fieldContainer}>
            <input type="number" className={fieldInput} value={draftItem.dimensions.width} onChange={handleDimensionChange('width')} />
          </div>
        </Field>
        <Field label="Height (cm)">
          <div className={fieldContainer}>
            <input type="number" className={fieldInput} value={draftItem.dimensions.height} onChange={handleDimensionChange('height')} />
          </div>
        </Field>
        <Field label="Depth (cm)">
          <div className={fieldContainer}>
            <input type="number" className={fieldInput} value={draftItem.dimensions.depth} onChange={handleDimensionChange('depth')} />
          </div>
        </Field>
      </div>

      <Field label="Weight (kg)" required>
        <div className={fieldContainer}>
          <input
            type="number"
            className={fieldInput}
            value={draftItem.weight ?? ''}
            onChange={handleFieldChange('weight')}
          />
        </div>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Item State" required>
          <DropDown
            buttonClassName="gap-2 items-center justify-between"
            options={itemStates.map((state) => ({
              value: state.id,
              display: state.name,
            }))}
            className={fieldContainer}
            state={[
              draftItem.item_state_id ?? undefined,
              (value) => setDraftItem((prev) => ({ ...prev, item_state_id: value == null ? null : Number(value) })),
            ]}
            placeholder={itemStates.length ? 'Select a state' : 'No states available'}
          />
        </Field>
        <Field label="Item Position" required>
          <DropDown
            buttonClassName="gap-2 items-center justify-between"
            options={itemPositions.map((position) => ({
              value: position.id,
              display: position.name,
            }))}
            className={fieldContainer}
            state={[
              draftItem.item_position_id ?? undefined,
              (value) => setDraftItem((prev) => ({ ...prev, item_position_id: value == null ? null : Number(value) })),
            ]}
            placeholder={itemPositions.length ? 'Select a position' : 'No positions available'}
          />
        </Field>
      </div>

      <BasicButton
        params={{
          variant: 'primary',
          onClick: onSubmit,
          disabled: !isValid,
          className: 'w-full',
        }}
      >
        {editingIndex != null ? 'Save Item' : '+ Add Item'}
      </BasicButton>
    </div>
  )
}

interface ItemsListTabProps {
  items: DraftItem[]
  onEditItem: (itemId: number) => void
  onDeleteItem: (itemId: number) => void | Promise<void>
}

function ItemsListTab({ items, onEditItem, onDeleteItem }: ItemsListTabProps) {
  const visibleItems = items.filter((item) => item.action !== 'delete')
  return (
    <div className="space-y-4">
      {visibleItems.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No items added yet.</p>
      ) : (
        visibleItems.map((item) => (
          <ItemCard
            key={getItemIdentifier(item)}
            item={buildDraftItemCard(item)}
            variant="draft"
            onAction={(action) => {
            if (action === 'edit') {
              onEditItem(getItemIdentifier(item))
            }
            if (action === 'delete') {
              onDeleteItem(getItemIdentifier(item))
            }
          }}
        />
        )))
      }
    </div>
  )
}

function resolveDraftPropertyValue(
  properties: Record<string, string> | undefined,
  property: ItemPropertyOption,
) {
  if (!properties) {
    return ''
  }
  if (property.name && property.name in properties) {
    return properties[property.name] ?? ''
  }
  const fallbackKey = property.id != null ? String(property.id) : undefined
  if (fallbackKey && fallbackKey in properties) {
    return properties[fallbackKey] ?? ''
  }
  return ''
}

interface PropertyFieldProps {
  property: ItemPropertyOption
  value: string
  onChange: (value: string) => void
}

function PropertyField({ property, value, onChange }: PropertyFieldProps) {
  const normalizedOptions = Array.isArray(property.options) ? property.options : []
  const fieldType = property.field_type?.toLowerCase?.()
  if (fieldType === 'dropdown' || fieldType === 'select') {
    const dropdownOptions = normalizedOptions.map((option) =>
      typeof option === 'string' ? { value: option, display: option } : { value: option.value, display: option.display ?? option.value },
    )
    return (
      <Field label={property.name} required={property.required}>
        <DropDown
          buttonClassName="gap-2 items-center justify-between"
          options={dropdownOptions}
          className={fieldContainer}
          state={[value || undefined, (next) => onChange(String(next ?? ''))]}
        />
      </Field>
    )
  }

  return (
    <Field label={property.name} required={property.required}>
      <div className={fieldContainer}>
        <input className={fieldInput} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </Field>
  )
}
