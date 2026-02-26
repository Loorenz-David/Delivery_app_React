import { planSectionsMap } from '@/features/plan/'
import { pageRegistry as orderPageRegistry } from '@/features/order/registry/orderSection.registry'
import { pageRegistry as orderCasePageRegistry } from '@/features/orderCase/registry/pageRegistry'

export const homeSectionRegistry = {
  ...orderPageRegistry,
  ...orderCasePageRegistry,
  ...planSectionsMap,
}
