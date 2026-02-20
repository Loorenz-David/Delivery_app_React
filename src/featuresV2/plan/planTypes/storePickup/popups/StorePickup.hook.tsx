
import { useEffect, useState } from 'react'
import type { address } from '@/types/address'
import type { StorePickupPlanInput } from '@/featuresV2/plan/types/storePickupPlan'
import { usePlanForm } from '@/featuresV2/plan/popups/PlanForm.context'
import { initialStorePickupForm } from '@/featuresV2/plan/popups/planFormSetters.hook'
import { useStorePickupWarnings } from './StorePickup.warnings'
import { storePickupValidation } from './StorePickupValidation'

export const useStorePickupForm = () => {
  const { planTypeForm, setPlanTypeForm, setPlanTypeValidationForm } = usePlanForm()
  const formState = (planTypeForm ?? initialStorePickupForm()) as StorePickupPlanInput
  const storePickupWarnings = useStorePickupWarnings()
  const [pickupLocationRaw, setPickupLocationRaw] = useState(() =>
    formState.pickup_location ? JSON.stringify(formState.pickup_location) : ''
  )

  useEffect(() => {
    setPickupLocationRaw(
      formState.pickup_location ? JSON.stringify(formState.pickup_location) : ''
    )
  }, [formState.pickup_location])

   useEffect(()=>{
      setPlanTypeValidationForm( ()=> {
        return ()=> storePickupValidation({ storePickupWarnings, formState })
      } )

    },[formState])

  const updateForm = (update: Partial<StorePickupPlanInput>) => {
    setPlanTypeForm((prev) => ({
      ...(prev ? (prev as StorePickupPlanInput) : initialStorePickupForm()),
      ...update,
    }))
  }



  const handleAddressSelection = ( value: address | null ) =>{
    storePickupWarnings.pickupLocationWarning.validate(value)
    updateForm({ pickup_location: value })
  }

  const handleSupervisorSelection = (value: number | null ) => {
    storePickupWarnings.supervisorWarning.validate(value)
    updateForm({ assigned_user_id: value })
  }



  return {
    formState,
    pickupLocationRaw,
    handleSupervisorSelection,
    handleAddressSelection,
    storePickupWarnings,
  }
}
