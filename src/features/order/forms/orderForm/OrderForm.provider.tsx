import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'

import { useOrderItemDraftController } from '../../item'
import { useOrderByClientId } from '../../store/orderHooks.store'

import { OrderFormContextProvider } from './OrderForm.context'
import type { OrderFormPayload, OrderFormState } from './OrderForm.types'
import { useOrderFormWarnings } from './OrderForm.warnings'
import { useOrderFormValidation } from './OrderForm.validation'
import { useOrderFormActions } from './orderForm.actions'
import { formatIsoDate } from '@/shared/utils/formatIsoDate'
import {
  buildOrderFormInitialState,
  buildOrderFormReinitKey,
  shouldReinitializeForm,
} from './orderFormBootstrap.flow'
import { useOrderFormItemsFlow } from './orderFormItems.flow'
import { useOrderFormItemEditorActions } from './orderFormItemEditor.actions'
import { useOrderFormSetters } from './orderForm.setters'

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

  const initialFormRef = useRef<OrderFormState | null>(null)
  const previousReinitKeyRef = useRef<string | null>(null)

  const [formState, setFormState] = useState<OrderFormState>(() =>
    buildOrderFormInitialState({
      mode,
      order,
      payloadDeliveryPlanId: payload?.deliveryPlanId ?? null,
      payloadRestoreFormState: payload?.restoreFormState ?? null,
    }),
  )

  const reinitKey = useMemo(
    () =>
      buildOrderFormReinitKey({
        mode,
        payloadClientId: payload?.clientId ?? null,
        payloadDeliveryPlanId: payload?.deliveryPlanId ?? null,
        orderServerId,
      }),
    [mode, orderServerId, payload?.clientId, payload?.deliveryPlanId],
  )

  useEffect(() => {
    if (!shouldReinitializeForm(previousReinitKeyRef.current, reinitKey)) {
      return
    }

    const nextState = buildOrderFormInitialState({
      mode,
      order,
      payloadDeliveryPlanId: payload?.deliveryPlanId ?? null,
      payloadRestoreFormState: payload?.restoreFormState ?? null,
    })

    setFormState(nextState)
    makeInitialFormCopy(initialFormRef, nextState)
    previousReinitKeyRef.current = reinitKey
  }, [mode, order, payload?.deliveryPlanId, payload?.restoreFormState, reinitKey])

  const warnings = useOrderFormWarnings()
  const formSetters = useOrderFormSetters({
    setFormState,
    warnings,
  })

  const { validateForm } = useOrderFormValidation({ formState, warnings })

  const { initialItems, isLoadingInitialItems, itemInitialByClientId } = useOrderFormItemsFlow({
    mode,
    orderServerId,
  })

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

  const draftOrderIdRef = useRef<number>(Date.now())
  const effectiveDraftOrderId = orderServerId ?? draftOrderIdRef.current

  const itemEditor = useOrderFormItemEditorActions({
    itemDraftController: {
      createItem,
      updateItem,
      deleteItem,
    },
    effectiveDraftOrderId,
  })

  const actions = useOrderFormActions({
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
      formState,
      warnings,
      formSetters,
      actions,
      itemEditor,
      meta: {
        mode,
        order,
        creationDate,
        initialFormRef,
        visibleItemDrafts,
        itemInitialByClientId,
        isLoadingInitialItems,
      },
    }),
    [
      actions,
      creationDate,
      formSetters,
      formState,
      isLoadingInitialItems,
      itemEditor,
      itemInitialByClientId,
      mode,
      order,
      visibleItemDrafts,
      warnings,
    ],
  )

  return <OrderFormContextProvider value={value}>{children}</OrderFormContextProvider>
}
