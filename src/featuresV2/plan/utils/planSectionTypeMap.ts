import type { ComponentType } from 'react'

import type { PlanTypeKey } from '@/featuresV2/plan/types/plan'
import { LocalDeliveryPage } from '@/featuresV2/plan/planTypes/localDelivery/pages/LocalDelivery.page'
import { InternationalShippingPage } from '@/featuresV2/plan/planTypes/internationalShipping/pages/InternationalShipping.page'
import { StorePickupPage } from '@/featuresV2/plan/planTypes/storePickup/pages/StorePickup.page'

export const planSectionTypeMap: Record<PlanTypeKey, string> = {
  local_delivery: 'LocalDeliveryPage',
  international_shipping: 'InternationalShippingPage',
  store_pickup: 'StorePickupPage',
}

export const PlanSectionTypesMap: Record<PlanTypeKey, ComponentType<any>> = {
  local_delivery: LocalDeliveryPage,
  international_shipping: InternationalShippingPage,
  store_pickup: StorePickupPage,
}
