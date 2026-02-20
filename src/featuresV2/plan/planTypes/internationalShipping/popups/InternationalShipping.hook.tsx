import { useEffect } from 'react'
import { usePlanForm } from '@/featuresV2/plan/popups/PlanForm.context'
import type { InternationalShippingPlanInput } from '@/featuresV2/plan/types/internationalShippingPlan'
import type { ChangeEvent } from 'react'
import { initialInternationalShippingForm } from '@/featuresV2/plan/popups/planFormSetters.hook'
import { useInternationalShippingWarnings } from './InternationalShipping.warnings'
import { internationalShippingValidation } from './InternationalShippingValidation.hook'

export const useInternationalShippingForm = () => {
  const { planTypeForm, setPlanTypeForm, setPlanTypeValidationForm } = usePlanForm()
  const formState = (planTypeForm ?? initialInternationalShippingForm()) as InternationalShippingPlanInput
  const internationalShippingWarnings = useInternationalShippingWarnings()

  const updateForm = (update: Partial<InternationalShippingPlanInput>) => {
    setPlanTypeForm((prev) => ({
      ...(prev ? (prev as InternationalShippingPlanInput) : initialInternationalShippingForm()),
      ...update,
    }))
  }



  const handleCarrierName = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    internationalShippingWarnings.carrierNameWarning.validate(value)
    updateForm({ carrier_name: value || null })
  }


  useEffect(()=>{
      setPlanTypeValidationForm( ()=> {
        return ()=> internationalShippingValidation({ internationalShippingWarnings })
      } )
    },[formState])
  

  return {
    formState,
    handleCarrierName,
    internationalShippingWarnings,

  }
}
