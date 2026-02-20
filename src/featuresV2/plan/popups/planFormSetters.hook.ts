import type { Dispatch, SetStateAction } from 'react'
import type { ChangeEvent } from 'react'
import { buildClientId } from '@/lib/utils/clientId'
import type { DeliveryPlan, PlanTypeKey } from '../types/plan'
import type { PlanTypeState } from './PlanForm.types'
import type { LocalDeliveryPlanInput } from '../planTypes/localDelivery/types/localDeliveryPlan'
import type { StorePickupPlanInput } from '../types/storePickupPlan'
import type { InternationalShippingPlanInput } from '../types/internationalShippingPlan'
import type { PlanWarningsControllers } from './PlanForm.types'
import {  usePlanStateRegistry } from '../hooks/planStates/usePlanStateRegistry'
type SetDeliveryPlanState = Dispatch< SetStateAction<DeliveryPlan> >
type SetPlanTypeState = Dispatch< SetStateAction<PlanTypeState | null> >


type PropsUsePlanFormSetters = {
    setPlanForm: SetDeliveryPlanState
    setPlanTypeForm: SetPlanTypeState
    planFormWarnings: PlanWarningsControllers
}

export const usePlanFormSetters = ({
    setPlanForm, 
    setPlanTypeForm, 
    planFormWarnings

}:PropsUsePlanFormSetters )=>{
    const handlePlanType = (value: PlanTypeKey)=>{
        setPlanForm(prev => ({...prev, plan_type: value }))
        setPlanTypeForm(initialPlanTypeForm(value))
        
    }
    const handlePlanName = (event: ChangeEvent<HTMLInputElement>)=>{
        const value = event.target.value
        planFormWarnings.planNameWarning.validate( value )
        setPlanForm(prev=>({...prev, label: value}))
    }

    const handleStartDate = (value: string)=>{
        setPlanForm( prev=>{
            const { end_date } = prev
            planFormWarnings.planStartDateWarning.validate( {start_date: value, end_date} )

            return {...prev, start_date: value} 
        })
    }
    const handleEndDate = (value: string)=>{
        setPlanForm( prev=>{
            const { start_date } = prev
            planFormWarnings.planStartDateWarning.validate( {start_date, end_date: value} )

            return {...prev, end_date: value }
        })
    }

    

    return {
        handlePlanType,
        handlePlanName,
        handleStartDate,
        handleEndDate,
        setPlanTypeForm,
    }
}

export const initialPlanForm = ()=>{
    const stateRegistry =  usePlanStateRegistry()
    const client_id = buildClientId('deliveryPlan')
    const plan_state_id =  stateRegistry.getByName('Open')?.id
    const label = 'Plan'
    const plan_type: 'local_delivery' = 'local_delivery'
    const start_date = new Date().toISOString()
    const end_date = new Date().toISOString()
    const state_id = null
    return {
        client_id,
        label,
        plan_type,
        start_date,
        end_date,
        state_id:plan_state_id

    }
}


export const initialLocalDeliveryForm = (): LocalDeliveryPlanInput => ({
    client_id: buildClientId('local-delivery-plan'),
})

export const initialInternationalShippingForm = (): InternationalShippingPlanInput => ({
    client_id: buildClientId('international-delivery-plan'),
    carrier_name: '',

})

export const initialStorePickupForm = (): StorePickupPlanInput => ({
    client_id: buildClientId('storePickup-delivery-plan'),
    pickup_location: null,

})

export const initialPlanTypeForm = (planType: PlanTypeKey): PlanTypeState => {
    switch (planType) {
        case 'international_shipping':
            return initialInternationalShippingForm()
        case 'store_pickup':
            return initialStorePickupForm()
        case 'local_delivery':
        default:
            return initialLocalDeliveryForm()
    }
}
