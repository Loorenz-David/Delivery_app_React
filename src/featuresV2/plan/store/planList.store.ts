import type { ListState } from '@/store/ListStoreFactory'
import type { PlanPagination, PlanQueryFilters, PlanStats } from '@/featuresV2/plan/types/planMeta'

import { createListStore } from '@/store/ListStoreFactory'

export const usePlanListStore = createListStore<PlanStats, PlanQueryFilters, PlanPagination>()

export const selectPlanListStats = (state: ListState<PlanStats, PlanQueryFilters, PlanPagination>) => state.stats

export const selectPlanListPagination = (state: ListState<PlanStats, PlanQueryFilters, PlanPagination>) =>
  state.pagination

export const selectPlanListQuery = (state: ListState<PlanStats, PlanQueryFilters, PlanPagination>) => state.query

export const selectPlanListLoading = (state: ListState<PlanStats, PlanQueryFilters, PlanPagination>) => state.isLoading

export const selectPlanListError = (state: ListState<PlanStats, PlanQueryFilters, PlanPagination>) => state.error

export const setPlanListResult = (payload: {
  queryKey: string
  query?: PlanQueryFilters
  stats?: PlanStats
  pagination?: PlanPagination
}) => usePlanListStore.getState().setResult(payload)

export const setPlanListLoading = (loading: boolean) => usePlanListStore.getState().setLoading(loading)

export const setPlanListError = (error?: string) => usePlanListStore.getState().setError(error)

export const clearPlanList = () => usePlanListStore.getState().clear()
