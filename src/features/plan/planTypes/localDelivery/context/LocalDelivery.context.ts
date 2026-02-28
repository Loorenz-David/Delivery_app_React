import { createContext } from 'react'


import type { Order } from '@/features/order/types/order'
import type { DeliveryPlan } from '@/features/plan/types/plan'
import type { LocalDeliveryPlan } from '../types/localDeliveryPlan'
import type { RouteSolution } from '../types/routeSolution'
import type { RouteSolutionStop } from '../types/routeSolutionStop'
import type { address } from '@/types/address'
import type { useLocalDeliveryHeaderAction } from '../actions/useLocalDeliveryHeaderAction'
import type { DeliveryPlanState } from '@/features/plan/types/planState'

export type LocalDeliveryContextValue = {
  planId: number
  plan: DeliveryPlan | null
  planState: DeliveryPlanState | null
  localDeliveryPlan: LocalDeliveryPlan | null
  localDeliveryPlanId: number | null
  planStartDate: string | null
  orders: Order[]
  orderCount:number
  stopByOrderId: Map<number, RouteSolutionStop>
  ordersById: Map<number, Order>
  selectedRouteSolution: RouteSolution | null
  routeSolutionId: number | null
  routeSolutionStops: RouteSolutionStop[]
  boundaryLocations: {
    start: {
      label: 'Start location' | 'End location'
      location: address | null
      time: string | null
    }
    end: {
      label: 'End location' | 'Start location' 
      location: address | null
      time: string | null
    }
  }
  localDeliveryActions: ReturnType<typeof useLocalDeliveryHeaderAction>
}

export const LocalDeliveryContext = createContext<LocalDeliveryContextValue | null>(null)
