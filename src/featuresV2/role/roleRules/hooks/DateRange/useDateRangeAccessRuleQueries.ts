import { useCallback } from 'react'

import { normalizeEntityMap } from '@/lib/utils/entities/normalizeEntityMap'
import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { roleRuleApi } from '@/featuresV2/role/roleRules/api/roleRuleApi'
import type { DateRangeAccessRule, DateRangeAccessRuleMap } from '@/featuresV2/role/roleRules/types/roleRule'
import type { DateRangeAccessRuleQueryFilters } from '@/featuresV2/role/roleRules/types/roleRuleMeta'
import {
  insertDateRangeAccessRules,
  upsertDateRangeAccessRule,
} from '@/featuresV2/role/roleRules/store/dateRangeAccessRuleStore'
import {
  setDateRangeAccessRuleListError,
  setDateRangeAccessRuleListLoading,
  setDateRangeAccessRuleListResult,
} from '@/featuresV2/role/roleRules/store/dateRangeAccessRuleListStore'

const buildQueryKey = (query?: DateRangeAccessRuleQueryFilters) => JSON.stringify(query ?? {})

export function useDateRangeAccessRuleQueries() {
  const { showMessage } = useMessageManager()

  const fetchDateRangeAccessRules = useCallback(
    async (query?: DateRangeAccessRuleQueryFilters) => {
      const queryKey = buildQueryKey(query)
      setDateRangeAccessRuleListLoading(true)
      try {
        const response = await roleRuleApi.listDateRangeAccessRules(query)
        const payload = response.data

        if (!payload?.date_range_access_rules) {
          console.warn('Date range access rules response missing date_range_access_rules', payload)
          setDateRangeAccessRuleListError('Missing date range access rules response.')
          return null
        }

        insertDateRangeAccessRules(payload.date_range_access_rules)
        setDateRangeAccessRuleListResult({
          queryKey,
          query,
          pagination: payload.date_range_access_rules_pagination,
        })

        return payload
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load date range rules.'
        const status = error instanceof ApiError ? error.status : 500
        console.error('Failed to fetch date range access rules', error)
        setDateRangeAccessRuleListError(message)
        showMessage({ status, message })
        return null
      }
    },
    [showMessage],
  )

  const fetchDateRangeAccessRuleById = useCallback(
    async (ruleId: number | string) => {
      try {
        const response = await roleRuleApi.getDateRangeAccessRule(ruleId)
        const payload = response.data

        const normalized = normalizeEntityMap<DateRangeAccessRule>(
          payload?.date_range_access_rule as DateRangeAccessRuleMap | DateRangeAccessRule,
        )
        if (!normalized) {
          console.warn('Date range access rule response missing date_range_access_rule', payload)
          return null
        }

        normalized.allIds.forEach((clientId) => {
          const rule = normalized.byClientId[clientId]
          if (rule) {
            upsertDateRangeAccessRule(rule)
          }
        })

        return normalized
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load date range rule.'
        const status = error instanceof ApiError ? error.status : 500
        console.error('Failed to fetch date range access rule', error)
        showMessage({ status, message })
        return null
      }
    },
    [showMessage],
  )

  return {
    fetchDateRangeAccessRules,
    fetchDateRangeAccessRuleById,
  }
}
