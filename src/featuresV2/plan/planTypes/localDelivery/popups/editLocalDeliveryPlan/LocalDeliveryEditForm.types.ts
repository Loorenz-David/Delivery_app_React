import type { ChangeEvent } from 'react'
import type { address } from '@/types/address'

import { useLocalDeliveryEditFormWarnings } from './LocalDeliveryEditForm.warnings'
import { useLocalDeliveryEditFormSubmitters } from './LocalDeliveryEditFormSubmit.hook'

export type PopupPayload = {
  localDeliveryPlanId?: number
  local_delivery_plan_id?: number
}

export type LocalDeliveryEditFormState = {
  local_delivery_plan_id: number | null
  delivery_plan: {
    id?: number 
    client_id?: string | null
    label: string
    start_date: string
    end_date: string
  }
  route_solution: {
    id?: number 
    client_id?: string | null
    label?: string | null
    start_location: address | null
    end_location: address | null
    set_start_time: string | null
    set_end_time: string | null
    route_end_strategy: string
    driver_id: number | null
    created_at?: string | null
    is_optimized?: string | null
  }
  create_variant_on_save: boolean
}

export type LocalDeliveryEditFormWarnings = ReturnType<typeof useLocalDeliveryEditFormWarnings>

export type LocalDeliveryEditFormSubmitters = ReturnType<typeof useLocalDeliveryEditFormSubmitters>

export type PropsLocalDeliveryEditFormContext = {
  formState: LocalDeliveryEditFormState
  formWarnings: LocalDeliveryEditFormWarnings
  hasMultipleVariants: boolean
  handlePlanLabel: (event: ChangeEvent<HTMLInputElement>) => void
  handlePlanStartDate: (value: string | null) => void
  handlePlanEndDate: (value: string | null) => void
  handleRouteStartTime: (value: string | null) => void
  handleRouteEndTime: (value: string | null) => void
  handleRouteStartLocation: (value: address | null) => void
  handleRouteEndLocation: (value: address | null) => void
  handleRouteEndStrategy: (value: string | number) => void
  handleDriverSelection: (value: number | null) => void
  handleCreateVariantToggle: (value: boolean) => void
} & LocalDeliveryEditFormSubmitters
