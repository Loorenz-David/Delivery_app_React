import { useState, useEffect, useRef } from 'react'
import type { ReactNode} from 'react'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'
import { PlanFormContextProvider } from './PlanForm.context'
import { usePlanFormSetters, initialPlanForm, initialPlanTypeForm } from './planFormSetters.hook'
import { usePlanFormWarnings } from './PlanForm.warnings'
import { usePlanFormSubmiters } from './planFormSubmit.hook'
import { usePlanFormValidation } from './PlanFormValidation'
import type { PlanTypeState } from './PlanForm.types'
import type { DeliveryPlan } from '../types/plan'
import { usePlanFormContextData } from './PlanFormContextData'



type PlanFormProvider = {
    children: ReactNode

}
export const PlanFormProvider = ({ children }:PlanFormProvider) => {
    const initialDeliveryPlanState = initialPlanForm()
    const [ planForm, setPlanForm ] = useState<DeliveryPlan > (initialDeliveryPlanState)
    const [ planTypeForm, setPlanTypeForm ] = useState<PlanTypeState | null>( initialPlanTypeForm(initialDeliveryPlanState.plan_type) )
    const [ planTypeValidationForm , setPlanTypeValidationForm ] = useState<(()=> ()=> boolean) | null>(null)

    const initialPlanFormRef = useRef<DeliveryPlan | null>(null)
    const initialPlanTypeFormRef = useRef<PlanTypeState | null>(null)
    const planFormWarnings = usePlanFormWarnings()
    const planSetters = usePlanFormSetters( {setPlanForm, setPlanTypeForm, planFormWarnings } )
    const { registerCloseGuard } = usePopupContext()

    const { planValidateForm } = usePlanFormValidation({
        registerCloseGuard,
        planFormWarnings,
        planForm,
        planTypeForm,
        initialPlanFormRef,
        initialPlanTypeFormRef
    })

    const {
        hasPlan,
        hasPlanType,
        mode,
        planData,
        planTypeData,
    } = usePlanFormContextData()
 
     const planSubmitters = usePlanFormSubmiters({
        planForm,
        planTypeForm,
        planTypeValidationForm,
        planValidateForm,
        initialPlanFormRef,
        initialPlanTypeFormRef,
    })

    useEffect(()=>{

        if (!hasPlan){
            makeInitialFormCopy( initialPlanFormRef, planForm )
            makeInitialFormCopy ( initialPlanTypeFormRef, planTypeForm )
            return
        }
        
        planData && setPlanForm( planData )
        planTypeData && setPlanTypeForm( planTypeData )

        makeInitialFormCopy( initialPlanFormRef, planData )
        makeInitialFormCopy ( initialPlanTypeFormRef, planTypeData )

        
    },[hasPlan, hasPlanType])




    const value = {
        planForm,
        planTypeForm,
        mode,
        setPlanTypeValidationForm,
        planFormWarnings,
        ...planSetters,
        ...planSubmitters

    }

    return (
        <PlanFormContextProvider value={value}>
            {children}
        </PlanFormContextProvider>
    )
}

