import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { roleRuleApi } from '@/featuresV2/role/roleRules/api/roleRuleApi'
import type { UserRoleRulesListResponse } from '@/featuresV2/role/roleRules/api/roleRuleApi'
import type { UserRoleRuleQueryFilters } from '@/featuresV2/role/roleRules/types/roleRuleMeta'
import {
  insertDateRangeAccessRules,
} from '@/featuresV2/role/roleRules/store/dateRangeAccessRuleStore'
import {
  insertOrderStateTransitionRules,
} from '@/featuresV2/role/roleRules/store/orderStateTransitionRuleStore'
import {
  setDateRangeAccessRuleListError,
  setDateRangeAccessRuleListLoading,
  setDateRangeAccessRuleListResult,
} from '@/featuresV2/role/roleRules/store/dateRangeAccessRuleListStore'
import {
  setOrderStateTransitionRuleListError,
  setOrderStateTransitionRuleListLoading,
  setOrderStateTransitionRuleListResult,
} from '@/featuresV2/role/roleRules/store/orderStateTransitionRuleListStore'

const buildQueryKey = (query?: UserRoleRuleQueryFilters) => JSON.stringify(query ?? {})

const handleRulesResponse = (
  payload: UserRoleRulesListResponse | null | undefined,
  queryKey: string,
  query?: UserRoleRuleQueryFilters,
) => {
  if (!payload?.date_range_access_rules || !payload?.order_state_transition_rules) {
    console.warn('User role rules response missing rules', payload)
    setDateRangeAccessRuleListError('Missing date range access rules response.')
    setOrderStateTransitionRuleListError('Missing order state transition rules response.')
    return null
  }

  insertDateRangeAccessRules(payload.date_range_access_rules)
  insertOrderStateTransitionRules(payload.order_state_transition_rules)

  setDateRangeAccessRuleListResult({
    queryKey,
    query,
    pagination: payload.date_range_access_rules_pagination,
  })
  setOrderStateTransitionRuleListResult({
    queryKey,
    query,
    pagination: payload.order_state_transition_rules_pagination,
  })

  return payload
}

export function useRoleRuleQueries() {
  const { showMessage } = useMessageManager()

  const fetchUserRoleRules = useCallback(
    async (query?: UserRoleRuleQueryFilters) => {
      const queryKey = buildQueryKey(query)
      setDateRangeAccessRuleListLoading(true)
      setOrderStateTransitionRuleListLoading(true)
      try {
        const response = await roleRuleApi.listUserRoleRules(query)
        return handleRulesResponse(response.data, queryKey, query)
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load role rules.'
        const status = error instanceof ApiError ? error.status : 500
        console.error('Failed to fetch user role rules', error)
        setDateRangeAccessRuleListError(message)
        setOrderStateTransitionRuleListError(message)
        showMessage({ status, message })
        return null
      }
    },
    [showMessage],
  )

  const fetchUserRoleRulesByRoleId = useCallback(
    async (roleId: number | string, query?: UserRoleRuleQueryFilters) => {
      const queryKey = buildQueryKey(query)
      setDateRangeAccessRuleListLoading(true)
      setOrderStateTransitionRuleListLoading(true)
      try {
        const response = await roleRuleApi.listUserRoleRulesByRoleId(roleId, query)
        return handleRulesResponse(response.data, queryKey, query)
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load role rules.'
        const status = error instanceof ApiError ? error.status : 500
        console.error('Failed to fetch user role rules by role', error)
        setDateRangeAccessRuleListError(message)
        setOrderStateTransitionRuleListError(message)
        showMessage({ status, message })
        return null
      }
    },
    [showMessage],
  )

  return {
    fetchUserRoleRules,
    fetchUserRoleRulesByRoleId,
  }
}
