import { createListStore } from '@/store/ListStoreFactory'
import type { ListState } from '@/store/ListStoreFactory'

import type { OrderPagination, OrderQueryFilters, OrderStats } from '../types/orderMeta'
import { useShallow } from 'zustand/react/shallow'

export const useOrderListStore = createListStore<OrderStats, OrderQueryFilters, OrderPagination>()

export const selectOrderListStats = (state: ListState<OrderStats, OrderQueryFilters, OrderPagination>) => state.stats

export const selectOrderListPagination = (
  state: ListState<OrderStats, OrderQueryFilters, OrderPagination>,
) => state.pagination

export const selectOrderListQuery = (state: ListState<OrderStats, OrderQueryFilters, OrderPagination>) => state.query

export const selectOrderListLoading = (state: ListState<OrderStats, OrderQueryFilters, OrderPagination>) =>
  state.isLoading

export const selectOrderListError = (state: ListState<OrderStats, OrderQueryFilters, OrderPagination>) =>
  state.error

export const setOrderListResult = (payload: {
  queryKey: string
  query?: OrderQueryFilters
  stats?: OrderStats
  pagination?: OrderPagination
}) => useOrderListStore.getState().setResult(payload)

export const setOrderListLoading = (loading: boolean) => useOrderListStore.getState().setLoading(loading)

export const setOrderListError = (error?: string) => useOrderListStore.getState().setError(error)

export const clearOrderList = () => useOrderListStore.getState().clear()


export const  useOrderStats = ()=> useOrderListStore(selectOrderListStats)