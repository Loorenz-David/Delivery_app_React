import type { PlanTypeKey } from '@/featuresV2/plan/types/plan'

export type PayloadBase ={
    ordersPlanType: PlanTypeKey | null
    planId?: number | null

}