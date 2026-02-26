import type { Dispatch, SetStateAction, ChangeEvent } from 'react'
import type { address } from '@/types/address'

import type { LocalDeliveryEditFormState, LocalDeliveryEditFormWarnings } from './LocalDeliveryEditForm.types'

type SetFormState = Dispatch<SetStateAction<LocalDeliveryEditFormState>>

type Props = {
  setFormState: SetFormState
  formWarnings: LocalDeliveryEditFormWarnings
}

const normalizeRouteEndStrategy = (
  value: string | number,
): 'round_trip' | 'custom_end_address' | 'end_at_last_stop' => {
  const normalized = String(value)
  if (normalized === 'custom_end_address') return 'custom_end_address'
  if (normalized === 'end_at_last_stop') return 'end_at_last_stop'
  return 'round_trip'
}

export const useLocalDeliveryEditFormSetters = ({ setFormState, formWarnings }: Props) => {
  const handlePlanLabel = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormState((prev) => ({
      ...prev,
      delivery_plan: { ...prev.delivery_plan, label: value },
    }))
  }

  const handlePlanStartDate = (value: string | null) => {
    if ( !value ) return
    setFormState((prev) => {
      const next = {
        ...prev,
        delivery_plan: { ...prev.delivery_plan, start_date: value },
      }
      formWarnings.planDateWarning.validate({
        start_date: value,
        end_date: prev.delivery_plan.end_date,
      })
      formWarnings.routeTimeWarning.validate({
        start_date: value,
        end_date: prev.delivery_plan.end_date,
        start_time: prev.route_solution.set_start_time,
        end_time: prev.route_solution.set_end_time,
      })
      return next
    })
  }

  const handlePlanEndDate = (value: string | null) => {
    if ( !value ) return
    setFormState((prev) => {
      const next = {
        ...prev,
        delivery_plan: { ...prev.delivery_plan, end_date: value },
      }
      formWarnings.planDateWarning.validate({
        start_date: prev.delivery_plan.start_date,
        end_date: value,
      })
      formWarnings.routeTimeWarning.validate({
        start_date: prev.delivery_plan.start_date,
        end_date: value,
        start_time: prev.route_solution.set_start_time,
        end_time: prev.route_solution.set_end_time,
      })
      return next
    })
  }

  const handleRouteStartTime = (value: string | null) => {
    setFormState((prev) => {
      const next = {
        ...prev,
        route_solution: { ...prev.route_solution, set_start_time: value },
      }
      formWarnings.routeTimeWarning.validate({
        start_date: prev.delivery_plan.start_date,
        end_date: prev.delivery_plan.end_date,
        start_time: value,
        end_time: prev.route_solution.set_end_time,
      })
      return next
    })
  }

  const handleRouteEndTime = (value: string | null) => {
    setFormState((prev) => {
      const next = {
        ...prev,
        route_solution: { ...prev.route_solution, set_end_time: value },
      }
      formWarnings.routeTimeWarning.validate({
        start_date: prev.delivery_plan.start_date,
        end_date: prev.delivery_plan.end_date,
        start_time: prev.route_solution.set_start_time,
        end_time: value,
      })
      return next
    })
  }

  const handleRouteStartLocation = (value: address | null) => {

    setFormState((prev) => ({
      ...prev,
      route_solution: { ...prev.route_solution, start_location: value },
    }))
  }

  const handleRouteEndLocation = (value: address | null) => {
    setFormState((prev) => ({
      ...prev,
      route_solution: { ...prev.route_solution, end_location: value },
    }))
  }

  const handleRouteEndStrategy = (value: string | number) => {
    setFormState((prev) => ({
      ...prev,
      route_solution: { ...prev.route_solution, route_end_strategy: normalizeRouteEndStrategy(value) },
    }))
  }

  const handleDriverSelection = (value: number | null) => {
    setFormState((prev) => ({
      ...prev,
      route_solution: { ...prev.route_solution, driver_id: value },
    }))
  }

  const handleCreateVariantToggle = (value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      create_variant_on_save: value,
    }))
  }

  return {
    handlePlanLabel,
    handlePlanStartDate,
    handlePlanEndDate,
    handleRouteStartTime,
    handleRouteEndTime,
    handleRouteStartLocation,
    handleRouteEndLocation,
    handleRouteEndStrategy,
    handleDriverSelection,
    handleCreateVariantToggle,
  }
}
