import type { ComponentType } from 'react'
import type { PlanTypeKey } from '@/featuresV2/plan/types/plan'
import { LocalDeliveryPage } from '../planTypes/localDelivery/pages/LocalDeliveryPage'
import { InternationalShippingPage } from '../planTypes/internationalShipping/pages/InternationalShippingPage'
import { StorePickupPage } from '../planTypes/storePickup/pages/StorePickupPage'


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


export const  SelectedPlanOrders = ({planType}: {planType:PlanTypeKey | null | undefined})=>{
  if ( planType ){

    return PlanSectionTypesMap[planType]
  }else{
    return null
  }
}