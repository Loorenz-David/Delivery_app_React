import { useCallback } from 'react'
import { useMessageManager } from '@/message_manager/MessageManagerContext'
import type { DeliveryPlan } from '../../types/plan'
import { usePlanController } from '../../controllers/plan.controller'
import { useBaseControlls, usePopupManager } from '@/shared/resource-manager/useResourceManager'
import { useOrderSelectionStore } from '@/featuresV2/order/store/orderSelection.store'


type Props = {
    planForm: DeliveryPlan
    planValidateForm: ()=>boolean
    selectedOrderServerIds?: number[]
    source?: 'order_multi_select' | null
}

export const usePlanFormActions = ({
    planForm,
    planValidateForm,
    selectedOrderServerIds = [],
    source,
}: Props) => {
    const { showMessage } = useMessageManager()
    const { createPlan, deletePlan } = usePlanController()
    const popupManager = usePopupManager()
    const baseControlls = useBaseControlls()


    const handleCreatePlan = useCallback ( async ()=>{

        const isValidPlanForm  = planValidateForm()


        if( !isValidPlanForm ) return showMessage({message:"Invalid form, check for required fields.", status:'warning'})

        const response = await createPlan(planForm, {
            newOrderLinks: selectedOrderServerIds,
        })

        if (response !== null){
            popupManager.closeByKey('PlanForm')
            if (source === 'order_multi_select') {
                useOrderSelectionStore.getState().disableSelectionMode()
            }
        }
    } , [createPlan, planForm, planValidateForm, popupManager, selectedOrderServerIds, showMessage, source] )

    const handleDeletePlan = useCallback(async () => {
        const planId = planForm.id ?? planForm.client_id
        if (!planId) {
            showMessage({message:"Plan id is missing.", status:'warning'})
            return
        }

        const result = await deletePlan(planId)
        if (result) {
            popupManager.closeByKey('PlanForm')
            baseControlls.closeBase()
        }
    }, [planForm, deletePlan, showMessage, popupManager])

    return {
        handleCreatePlan,
        handleDeletePlan
    }
}
