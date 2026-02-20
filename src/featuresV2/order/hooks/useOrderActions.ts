import { useCallback } from 'react'

import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import { deleteQueryFilter, resetQuery, setQueryFilters, setQuerySearch, updateQueryFilters, useOrderQuery } from '../store/orderQueryStore'
import type { OrderQueryFilters, OrderQueryStringQueries } from "../types/orderMeta";
import { orderStringFilters } from '../domain/orderFilterConfig'

export const useOrderActions = () => {
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()
  const query = useOrderQuery()
  
  const openOrderForm = useCallback(
    (payload?: { clientId?: string; mode?: 'create' | 'edit'; deliveryPlanId?: number | null }) => {
      console.log('open order form ??')
      popupManager.open({ key: 'order.edit', payload:{...payload, controllBodyLayout:true} })
    },
    [popupManager],
  )
  const openOrderCases = useCallback(
    (payload: { orderId?: number, orderReference:string })=>{
      sectionManager.open({key:'orderCase.orderCases', payload, parentParams:{ borderLeft:'rgb(var(--color-turques-r),0.7)'}})
    },
    []
  )
  const openOrderDetail = useCallback(
    (payload: { clientId?: string; serverId?: number; mode?: 'view' | 'edit' }) => {
      sectionManager.open({ key: 'order.details', payload , parentParams:{pageClass:'bg-[var(--color-muted)]/10 ', borderLeft:'rgb(var(--color-light-blue-r),0.7)'}})
    },
    [sectionManager],
  )

  const applySearch = useCallback(
    (input: string) => {
      const trimmed = input.trim()
      setQuerySearch(trimmed)
    },
    []
  )
  const applyFilters = useCallback(
    (filters: OrderQueryFilters) => {
      setQueryFilters(filters)
    },
    []
  )
  const resetFilters = useCallback(() => {
    resetQuery()
  }, [])

  const updateFilters = useCallback(
    (key: OrderQueryStringQueries, value: unknown) => {
      if (orderStringFilters.has(key)) {
        const previous = query.filters.s ?? []
        const alreadySelected = previous.includes(key as OrderQueryStringQueries)
        if (alreadySelected) return

        updateQueryFilters({ s: [ ...(query.filters.s || []), key as OrderQueryStringQueries] })
        return
      } 
      updateQueryFilters({ [key]: value })
    },
    [query]
  )
  const deleteFilter = useCallback(
    (key:OrderQueryStringQueries) => {
        if (orderStringFilters.has(key)) { 
         
          const newStringFilters = (query.filters.s || []).filter(f => f !== key)

          updateQueryFilters({ s: newStringFilters })
          return
        }
      deleteQueryFilter(key as keyof OrderQueryFilters)
    },
    [query]
  )


  return {
    openOrderForm,
    openOrderDetail,
    applySearch,
    applyFilters,
    resetFilters,
    updateFilters,
    deleteFilter,
    openOrderCases
  }
}


