import { planPopupRegistry } from '@/featuresV2/plan/'
import { popupRegistry as orderPopupRegistry } from '@/featuresV2/order/registry/orderPopups.registry'
// import { itemPopupRegistry } from '@/featuresV2/item/registry/itemPopups'

export const homePopupRegistry = {
  ...planPopupRegistry,
  ...orderPopupRegistry,
  // ...itemPopupRegistry
}
