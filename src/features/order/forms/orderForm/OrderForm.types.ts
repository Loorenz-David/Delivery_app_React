import type { RefObject } from 'react'

import type { address } from '@/types/address'
import type { Phone } from '@/types/phone'

import type { Item } from '../../item'
import type { Order } from '../../types/order'
import type { useOrderFormWarnings } from './OrderForm.warnings'
import type { useOrderFormActions } from './orderForm.actions'
import type { useOrderFormSetters } from './orderForm.setters'
import type { useOrderFormItemEditorActions } from './orderFormItemEditor.actions'

export type OrderFormMode = 'create' | 'edit'

export type OrderFormState = {
  client_id: string
  order_plan_objective: string | null
  reference_number: string
  external_source: string
  tracking_number: string
  tracking_link: string
  client_first_name: string
  client_last_name: string
  client_email: string
  client_primary_phone: Phone
  client_secondary_phone: Phone
  client_address: address | null
  earliest_delivery_date: string | null
  latest_delivery_date: string | null
  preferred_time_start: string
  preferred_time_end: string
  delivery_plan_id?: number | null
}

export type OrderFormPayload = {
  mode?: OrderFormMode
  clientId?: string
  deliveryPlanId?: number | null
  restoreFormState?: OrderFormState
}

export type OrderFormWarnings = ReturnType<typeof useOrderFormWarnings>
export type OrderFormActions = ReturnType<typeof useOrderFormActions>
export type OrderFormSetters = ReturnType<typeof useOrderFormSetters>
export type OrderFormItemEditorState = ReturnType<typeof useOrderFormItemEditorActions>

export type OrderFormMeta = {
  mode: OrderFormMode
  order: Order | null
  creationDate: string | null
  initialFormRef: RefObject<OrderFormState | null>
  visibleItemDrafts: Item[]
  itemInitialByClientId: Record<string, Item>
  isLoadingInitialItems: boolean
}

export type OrderFormContextValue = {
  formState: OrderFormState
  warnings: OrderFormWarnings
  formSetters: OrderFormSetters
  actions: OrderFormActions
  itemEditor: OrderFormItemEditorState
  meta: OrderFormMeta
}
