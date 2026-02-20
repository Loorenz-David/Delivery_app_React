import { planSections } from '@/featuresV2/plan/registry/planSections'
import { pageRegistry as orderPageRegistry } from '@/featuresV2/order/registry/pageRegistry'
import { pageRegistry as orderCasePageRegistry } from '@/featuresV2/orderCase/registry/pageRegistry'

export const homeSectionRegistry = {
  ...orderPageRegistry,
  ...orderCasePageRegistry,
  ...planSections,
}
