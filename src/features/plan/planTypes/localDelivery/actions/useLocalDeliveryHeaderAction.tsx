
import { useMemo } from 'react'

import { useOrderActions } from '@/features/order'
import { useDownloadTemplateByEventFlow } from '@/features/templates/printDocument/flows'
import { serializeRouteSolutionForTemplate } from '@/features/plan/planTypes/localDelivery/domain/serializeRouteSolutionForTemplate'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import { useRouteSolutionMutations } from '../controllers/routeSolution.controller'
import { useLocalDeliveryPlanSettingsMutations } from '@/features/plan/planTypes/localDelivery/controllers/localDeliveryPlanSettings.controller'
import type { DeliveryPlan } from '@/features/plan/types/plan'
import type { RouteSolution, RouteSolutionWarning } from '@/features/plan/planTypes/localDelivery/types/routeSolution'
import { createRouteWarningActionRegistry } from './routeWarningActionRegistry'
import { useMessageHandler } from '@/shared/message-handler'


type Props = {
  localDeliveryPlanId?: number | null
  planId?: number | null
  plan?: DeliveryPlan | null
  selectedRouteSolution?: RouteSolution | null
}

export const useLocalDeliveryHeaderAction = ({
  localDeliveryPlanId,
  planId,
  plan,
  selectedRouteSolution,
}: Props) => {
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()
  const {openOrderForm} = useOrderActions()
  const { routeReadyForDelivery } = useRouteSolutionMutations()
  const { updateLocalDeliverySettings } = useLocalDeliveryPlanSettingsMutations()
  const { showMessage } = useMessageHandler()
  const { downloadByEvent } = useDownloadTemplateByEventFlow()
  const routeWarningActionRegistry = useMemo(
    () => createRouteWarningActionRegistry(),
    [],
  )
  
  const handleCreateOrder = () => {
    openOrderForm({
      mode:'create',
      deliveryPlanId:planId
    })
  }
  const handleEditLocalPlan = () => {
    popupManager.open({
      key: 'LocalDeliveryEditForm',
      payload: { localDeliveryPlanId: localDeliveryPlanId },
    })
  }

  const handleOpenRouteStats = () => {
    sectionManager.open({
      key: 'LocalDeliveryStatsPage',
      payload: { localDeliveryPlanId: localDeliveryPlanId, planId:planId },
    })
  }


  const handlePrintRouteSolution = async () => {
    const payload = serializeRouteSolutionForTemplate(planId, localDeliveryPlanId)
    if (!payload) return

    await downloadByEvent({
      channel: 'route',
      event: 'route_solution_for_printing',
      data: payload,
      fileName: `route-${payload.plan_date ?? 'plan'}.pdf`,
    })
  }
  const routeReadyForDeliveryAction = async ()=>{
    if(!planId) return
    await routeReadyForDelivery(planId)
  }

  const resolveRouteWarnings = async (warnings: RouteSolutionWarning[]) => {
    const warningList = Array.isArray(warnings) ? warnings : []
    if (warningList.length === 0) return false

    let hasSuccess = false
    for (const warning of warningList) {
      const warningType = warning?.type
      if (typeof warningType !== 'string') continue
      const handler = routeWarningActionRegistry[warningType]
      if (!handler) continue

      const didResolve = await handler(warning, {
        localDeliveryPlanId,
        plan,
        selectedRouteSolution,
        updateLocalDeliverySettings,
      })
      if (didResolve) {
        hasSuccess = true
      }
    }

    if (!hasSuccess) {
      showMessage({
        status: 'warning',
        message: 'No route warnings could be resolved with this action.',
      })
    }
    return hasSuccess
  }


  return {
    handleOpenRouteStats,
    handleCreateOrder,
    handleEditLocalPlan,
    handlePrintRouteSolution,
    routeReadyForDelivery: routeReadyForDeliveryAction,
    resolveRouteWarnings,
  }
}
