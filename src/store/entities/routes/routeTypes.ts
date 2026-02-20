
import type { AddressPayload } from '../../types/complementTypes'


export interface OptimizationOrderSequenceEntry {
  delivery_arrangement?: number
  expected_arrival_time?: string | null
}

export type OptimizationOrderSequence =
  | Record<string, OptimizationOrderSequenceEntry>
  | OptimizationOrderSequenceEntry[]
  | number[]


export interface RouteStatePayload {
  id: number
  name: string
}

export interface SavedOptimizations{
  total_distance_meters: number;
  total_duration_seconds: number;
  expected_start_time: string | null;
  expected_end_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  start_location: AddressPayload;
  end_location: AddressPayload;
  order_sequence: OptimizationOrderSequence;
  skipped_shipments: Array<{
    order_id: number;
    reason: string;
  }>;
  polylines: Record<string, string | null>;
  consider_traffic: boolean;
  id?: string | number;
  created_at?: string;
  stops?: number;
  distance_km?: number;
}
export type RouteSavedOptimizations = SavedOptimizations | SavedOptimizations[] | null


export type Route = {
    id:number
    OrderIds: number []
    route_label: string
    delivery_date: string
    arrival_time_range?: number | null
    driver_id?: number | null
    driver?: { id: number; username?: string; email?: string; role?: unknown; team?: TeamPayload } | null
    set_start_time?: string | null
    set_end_time?: string | null
    expected_start_time?: string
    expected_end_time?: string
    actual_start_time?: string
    actual_end_time?: string
    start_location: AddressPayload
    end_location: AddressPayload
    using_optimization_indx?: number
    saved_optimizations: RouteSavedOptimizations
    state_id: number
    is_optimized: boolean
    route_state: RouteStatePayload
    is_unpack?: boolean
    total_orders?: number
    total_items?: number
    total_weight?: number
    total_volume?: number
    total_distance_meters?: number
    total_duration_seconds?: number
    delivery_time_range?: number
}