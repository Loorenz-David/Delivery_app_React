import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { DeliveryPlan, PlanTypeKey } from '../types/plan'

import type { LocalDeliveryPlanInput } from '../planTypes/localDelivery/types/localDeliveryPlan'
import type { StorePickupPlanInput } from '../types/storePickupPlan'
import type { InternationalShippingPlanInput } from '../types/internationalShippingPlan'
import { usePlanFormWarnings } from './PlanForm.warnings'
import { usePlanFormSubmiters } from './planFormSubmit.hook'

export type PlanFormMode = 'create' | 'edit'

export type PopupPayload = {
    clientId?: string
    serverId?: number
    mode: PlanFormMode
}

export type PlanTypeState =
  | LocalDeliveryPlanInput 
  | InternationalShippingPlanInput 
  | StorePickupPlanInput 


export type PropsPlanFormContext = {
    planForm: DeliveryPlan
    planTypeForm: PlanTypeState | null
    mode: PlanFormMode
    handlePlanType: (value:PlanTypeKey) => void
    handlePlanName: (value:ChangeEvent<HTMLInputElement>) => void
    handleStartDate: (value:string) => void
    handleEndDate: (value:string) => void
    setPlanTypeForm: Dispatch<SetStateAction<PlanTypeState | null>>
    handleCreatePlan: () => void
    setPlanTypeValidationForm: (value: ()=> ()=>boolean ) => void
    planFormWarnings: PlanWarningsControllers
} & PlanFormSubmiters

export type PlanWarningsControllers = ReturnType<typeof usePlanFormWarnings>

export type PlanFormSubmiters = ReturnType<typeof usePlanFormSubmiters>
