
import { useOrderActions } from '@/features/order'
import { useDownloadTemplateByEventFlow } from '@/features/templates/printDocument/flows'
import { serializeRouteSolutionForTemplate } from '@/features/plan/planTypes/localDelivery/domain/serializeRouteSolutionForTemplate'
import { usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'
import { useRouteSolutionMutations } from '../controllers/routeSolution.controller'


type Props = {
  localDeliveryPlanId?: number | null
  planId?: number | null
}

export const useLocalDeliveryHeaderAction = ({ localDeliveryPlanId, planId}: Props) => {
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()
  const {openOrderForm} = useOrderActions()
  const { routeReadyForDelivery } = useRouteSolutionMutations()
  const { downloadByEvent } = useDownloadTemplateByEventFlow()
  
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


  return {
    handleOpenRouteStats,
    handleCreateOrder,
    handleEditLocalPlan,
    handlePrintRouteSolution,
    routeReadyForDelivery: routeReadyForDeliveryAction
  }
}
