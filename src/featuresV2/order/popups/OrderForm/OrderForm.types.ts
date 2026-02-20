import type { Dispatch, RefObject, SetStateAction } from 'react'

import type { address } from '@/types/address'
import type { Phone } from '@/types/phone'

import type { Item } from '../../item/types'
import type { ItemPopupPayload } from '../../item/types'
import type { Order } from '../../types/order'
import type { useOrderFormWarnings } from './OrderForm.warnings'
import type { useOrderFormSubmit } from './useOrderFormSubmit'

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

export type OrderFormWarnings = ReturnType<typeof useOrderFormWarnings>

export type OrderFormSubmitters = ReturnType<typeof useOrderFormSubmit>

export type OrderFormPayload = {
  mode?: OrderFormMode
  clientId?: string
  deliveryPlanId?: number | null
}

export type OrderFormContextValue = {
  mode: OrderFormMode
  order: Order | null
  creationDate: string | null
  formState: OrderFormState
  setFormState: Dispatch<SetStateAction<OrderFormState>>
  initialFormRef: RefObject<OrderFormState | null>
  warnings: OrderFormWarnings
  visibleItemDrafts: Item[]
  itemInitialByClientId: Record<string, Item>
  isLoadingInitialItems: boolean
  openItemCreateForm: () => void
  openItemEditForm: (item: Item) => void
  isItemEditorOpen: boolean
  itemEditorPayload?: ItemPopupPayload
  closeItemEditor: () => void
} & OrderFormSubmitters
