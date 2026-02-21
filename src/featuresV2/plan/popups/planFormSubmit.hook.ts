import { useCallback } from 'react'
import { useMessageManager } from '@/message_manager/MessageManagerContext'
import type { DeliveryPlan } from '../types/plan'
import type { PlanTypeState } from './PlanForm.types'
import { usePlanMutations } from '../hooks/usePlanMutations'
import { useBaseControlls, usePopupManager } from '@/shared/resource-manager/useResourceManager'
import { getObjectDiff } from '@/shared/utils/getObjectDiff'
import type { RefObject } from 'react'


type Props = {
    planForm: DeliveryPlan
    planTypeForm: PlanTypeState  | null
    planTypeValidationForm: (()=> ()=>boolean) | null
    planValidateForm: ()=>boolean
    initialPlanFormRef: RefObject<DeliveryPlan | null>
    initialPlanTypeFormRef: RefObject<PlanTypeState | null>

}
export const usePlanFormSubmiters = ({
    planForm,
    planTypeForm,
    planTypeValidationForm,
    planValidateForm,
    initialPlanFormRef,
    initialPlanTypeFormRef,
}: Props) => {
    const { showMessage } = useMessageManager()
    const { createPlan, updatePlan, deletePlan } = usePlanMutations()
    const popupManager = usePopupManager()
    const baseControlls = useBaseControlls()


    const handleCreatePlan = useCallback ( async ()=>{

        const isValidPlanForm  = planValidateForm()
        const isValidPlanTypeForm = planTypeValidationForm ? planTypeValidationForm() : true


        if( !isValidPlanForm || !isValidPlanTypeForm ) return showMessage({message:"Invalid form, check for required fields.", status:'warning'})

        const deliveryPlanFields = {...planForm, [ planForm.plan_type ]: planTypeForm ?? {} }

        const response = await createPlan( deliveryPlanFields )

        if (response !== null){
            popupManager.closeByKey('PlanForm')
        }
    } , [planForm, planTypeForm, planTypeValidationForm] )

    const handleSavePlan = useCallback(async () => {
        const isValidPlanForm  = planValidateForm()
        const isValidPlanTypeForm = planTypeValidationForm ? planTypeValidationForm() : true

        if (!isValidPlanForm || !isValidPlanTypeForm) {
            showMessage({message:"Invalid form, check for required fields.", status:'warning'})
            return
        }

        const initialPlanForm = initialPlanFormRef.current
        const initialPlanTypeForm = initialPlanTypeFormRef.current

        if (!initialPlanForm) {
            showMessage({message:"Missing initial plan data.", status:'warning'})
            return
        }

        const planChanges = getObjectDiff(initialPlanForm, planForm)
        const planTypeChanges = planTypeForm && initialPlanTypeForm
            ? getObjectDiff(initialPlanTypeForm, planTypeForm)
            : {}

        const hasPlanChanges = Object.keys(planChanges).length > 0
        const hasPlanTypeChanges = Object.keys(planTypeChanges).length > 0

        if (!hasPlanChanges && !hasPlanTypeChanges) {
            showMessage({message:"No changes to save.", status:'warning'})
            return
        }

        if (!planForm.client_id) {
            showMessage({message:"Plan client id is missing.", status:'warning'})
            return
        }

        const payload = {
            ...(planChanges as Record<string, unknown>),
            ...(hasPlanTypeChanges
                ? {
                    plan_type: planForm.plan_type,
                    [planForm.plan_type]: planTypeChanges,
                }
                : {}),
        }

        const result = await updatePlan(planForm.client_id, payload)
        if (result) {
            popupManager.closeByKey('PlanForm')
        }
    }, [
        planForm,
        planTypeForm,
        planValidateForm,
        planTypeValidationForm,
        initialPlanFormRef,
        initialPlanTypeFormRef,
        updatePlan,
        showMessage,
        popupManager,
    ])

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
        handleSavePlan,
        handleDeletePlan
    }
}
