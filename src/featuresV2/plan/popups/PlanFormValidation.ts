
import { useEffect } from 'react'
import type { RefObject } from 'react'

import { hasFormChanges } from '@/shared/data-validation/compareChanges'

import type { DeliveryPlan } from '../types/plan'
import type { PlanWarningsControllers, PlanTypeState } from './PlanForm.types'

type Props = {
    registerCloseGuard: ( fn:()=>boolean )=> void
    planFormWarnings: PlanWarningsControllers
    planForm: DeliveryPlan
    planTypeForm: PlanTypeState  | null
    initialPlanFormRef: RefObject<DeliveryPlan | null>
    initialPlanTypeFormRef: RefObject<PlanTypeState | null>
}

export const usePlanFormValidation = ({
    registerCloseGuard,
    planFormWarnings,
    planForm,
    planTypeForm,
    initialPlanFormRef,
    initialPlanTypeFormRef
}:Props)=>{

    const planValidateForm = ()=>{
        const v = planFormWarnings

        const valid =[
            v.planNameWarning.validate(planForm.label),
            v.planStartDateWarning.validate({start_date: planForm.start_date, end_date: planForm.end_date })
        ]
        
        return valid.every( v => v === true)
    }

    const setCloseGuards = () =>{
        const val =  (
            !hasFormChanges( planForm, initialPlanFormRef) 
            && !hasFormChanges( planTypeForm, initialPlanTypeFormRef) 
        )
       
        return val
    }

    useEffect(()=>{

        const unregister = registerCloseGuard( setCloseGuards )
        return unregister
    },[planForm, planTypeForm ])


    return {
        planValidateForm,
        hasChanges: setCloseGuards
    }
}

