import type { address } from '@/types/address'
import type { PlanTypeDefaults, PlanTypeKey } from '@/features/plan/types/plan'

export type PlanTypeDefaultsContext = {
  getCurrentLocationAddress: () => Promise<address>
}

export type PlanTypeDefaultsGenerator = (
  ctx: PlanTypeDefaultsContext,
) => Promise<PlanTypeDefaults | undefined>

export type PlanTypeDefaultsResolver = (
  planType: PlanTypeKey,
  ctx: PlanTypeDefaultsContext,
) => Promise<PlanTypeDefaults | undefined>
