// hooks/usePlanFormContextData.ts
import { usePopupManager } from '@/shared/resource-manager/useResourceManager'
import { usePlanByClientId, usePlanByServerId } from '@/featuresV2/plan/hooks/usePlanSelectors'
import {  usePlanTypeWithFetch } from '@/featuresV2/plan/hooks/usePlanTypeWithFetch'
import type { PopupPayload } from './PlanForm.types'

export const usePlanFormContextData = () => {
  const popupManager = usePopupManager()
  const entryPayload = popupManager.getEntryPayload('PlanForm') as PopupPayload | undefined

  const clientId = entryPayload?.clientId ?? null
  const serverId = entryPayload?.serverId ?? null
  const mode = entryPayload?.mode ?? 'create'

  const planData = usePlanByServerId(serverId)
  const planTypeData = usePlanTypeWithFetch(planData?.client_id)

  return {
    clientId,
    mode,
    planData,
    planTypeData,
    isEdit: mode === 'edit',
    hasPlan: !!planData,
    hasPlanType: !!planTypeData
  }
}
