import { planPopupRegistry } from '@/features/plan/'
import { popupRegistry as orderPopupRegistry } from '@/features/order/registry/orderPopups.registry'
// import { itemPopupRegistry } from '@/features/item/registry/itemPopups'

export const homePopupRegistry = {
  ...planPopupRegistry,
  ...orderPopupRegistry,
  // ...itemPopupRegistry
}

export const loadingPopupRegistry = {
  
}