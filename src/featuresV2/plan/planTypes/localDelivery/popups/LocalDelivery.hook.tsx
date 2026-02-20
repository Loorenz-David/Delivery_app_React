import { useEffect } from 'react'
import { usePlanForm } from '@/featuresV2/plan/popups/PlanForm.context'
import type { LocalDeliveryPlan } from '@/featuresV2/plan/planTypes/localDelivery/types/localDeliveryPlan'
import { initialLocalDeliveryForm } from '@/featuresV2/plan/popups/planFormSetters.hook'
import { useLocalDeliveryWarnings } from './LocalDelivery.warnings'
import { localDeliveryValidation } from './LocalDeliveryValidation'

export const useLocalDeliveryForm = () => {
  const { planTypeForm, planForm, setPlanTypeForm, setPlanTypeValidationForm } = usePlanForm()
  const formState = (planTypeForm ?? initialLocalDeliveryForm()) as LocalDeliveryPlan
  const localDeliveryWarnings = useLocalDeliveryWarnings(planForm)
  
  const updateForm = (update: Partial<LocalDeliveryPlan>) => {
    setPlanTypeForm((prev) => ({
      ...(prev ? (prev as LocalDeliveryPlan) : initialLocalDeliveryForm()),
      ...update,
    }))
  }

  const handleActualStartTime = (value: string) => {
    localDeliveryWarnings.actualTimeWarning.validate({
      startTime: value,
      endTime: formState.actual_end_time,
    })
    updateForm({ actual_start_time: value || null })
  }

  const handleActualEndTime = (value: string) => {
    localDeliveryWarnings.actualTimeWarning.validate({
      startTime: formState.actual_start_time,
      endTime: value,
    })
    updateForm({ actual_end_time: value || null })
  }


  const handleDriverSelection = (driver_id: number | null) => {
    localDeliveryWarnings.driverWarning.validate(driver_id)
    updateForm({ driver_id: driver_id })
  }


  useEffect(()=>{
    setPlanTypeValidationForm( ()=> {
      return ()=> localDeliveryValidation({ localDeliveryWarnings, formState })
    } )
  },[formState])

   useEffect(()=>{
        localDeliveryWarnings.actualTimeWarning.validate( { 
          startTime: formState.actual_start_time,
          endTime: formState.actual_end_time
        } )
    },[planForm.start_date, planForm.end_date])

  return {
    formState,
    handleActualStartTime,
    handleActualEndTime,
    handleDriverSelection,
    localDeliveryWarnings,
  }
}
