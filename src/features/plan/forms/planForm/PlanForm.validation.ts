
import { useEffect } from 'react'
import type { RefObject } from 'react'

import { hasFormChanges } from '@/shared/data-validation/compareChanges'

import type { DeliveryPlan } from '../../types/plan'
import type { PlanWarningsControllers, PlanTypeState } from './PlanForm.types'

type Props = {
    registerCloseGuard: ( fn:()=>boolean )=> void
    planFormWarnings: PlanWarningsControllers
    planForm: DeliveryPlan
    initialPlanFormRef: RefObject<DeliveryPlan | null>
}

export const usePlanFormValidation = ({
    registerCloseGuard,
    planFormWarnings,
    planForm,
    initialPlanFormRef,
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
        )
       
        return val
    }

    useEffect(()=>{

        const unregister = registerCloseGuard( setCloseGuards )
        return unregister
    },[planForm ])


    return {
        planValidateForm,
        hasChanges: setCloseGuards
    }
}

