import { ORDER_EVENTS } from "@/featuresV2/order/domain/orderEvents"
import { PLAN_EVENTS } from "@/featuresV2/plan/domain/planEvents"


export type EventDefinition = {
  key: string
  label: string
  description?: string
}

export const SMS_EVENTS: EventDefinition[] = [
    ...ORDER_EVENTS,
    ...PLAN_EVENTS,
]
    