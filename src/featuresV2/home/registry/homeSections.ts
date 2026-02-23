import { planSectionsMap } from '@/featuresV2/plan/'
import { pageRegistry as orderPageRegistry } from '@/featuresV2/order/registry/pageRegistry'
import { pageRegistry as orderCasePageRegistry } from '@/featuresV2/orderCase/registry/pageRegistry'

export const homeSectionRegistry = {
  ...orderPageRegistry,
  ...orderCasePageRegistry,
  ...planSectionsMap,
}
