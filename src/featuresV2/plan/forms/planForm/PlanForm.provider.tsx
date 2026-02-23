import { useState, useEffect, useRef } from 'react'
import type { ReactNode} from 'react'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'
import { PlanFormContextProvider } from './PlanForm.context'
import { usePlanFormSetters } from './planForm.setters'
import { usePlanFormWarnings } from './PlanForm.warnings'
import { usePlanFormActions } from './planForm.actions'
import { usePlanFormValidation } from './PlanForm.validation'
import type { DeliveryPlan } from '../../types/plan'
import { usePlanFormContextData } from './PlanFormContextData'
import { usePlanFormBootstrapFlow } from './planFormBootstrap.flow'



type PlanFormProvider = {
    children: ReactNode

}
export const PlanFormProvider = ({ children }:PlanFormProvider) => {
    const { initialPlanForm } = usePlanFormBootstrapFlow()

    const [ planForm, setPlanForm ] = useState<DeliveryPlan > (initialPlanForm)
    const initialPlanFormRef = useRef<DeliveryPlan | null>(null)

    const planFormWarnings = usePlanFormWarnings()
    const planSetters = usePlanFormSetters( {setPlanForm, planFormWarnings } )
    
    const { registerCloseGuard } = usePopupContext()
    const { planValidateForm } = usePlanFormValidation({
        registerCloseGuard,
        planFormWarnings,
        planForm,
        initialPlanFormRef,
    })

    const {
        hasPlan,
        mode,
        source,
        planData,
        selectedOrderServerIds,
    } = usePlanFormContextData()
 
     const planActions = usePlanFormActions({
        planForm,
        planValidateForm,
        source,
        selectedOrderServerIds,
    })

    useEffect(()=>{

        if (!hasPlan){
            makeInitialFormCopy( initialPlanFormRef, planForm )
            return
        }
        
        planData && setPlanForm( planData )

        makeInitialFormCopy( initialPlanFormRef, planData )

        
    },[hasPlan])




    const value = {
        planForm,
        mode,
        planFormWarnings,
        planSetters,
        planActions

    }

    return (
        <PlanFormContextProvider value={value}>
            {children}
        </PlanFormContextProvider>
    )
}
