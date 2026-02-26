export type RouteSolutionStop = {
  id?: number
  client_id: string
  order_id?: number | null
  route_solution_id?: number | null
  stop_order?: number | null
  eta_status?: string | null
  in_range?: boolean | null
  reason_was_skipped?: string | null
  expected_arrival_time?: string | null
  has_constraint_violation?: boolean
  constraint_warnings?: Array<Record<string, unknown>> | null
}

export type RouteSolutionStopMap = {
  byClientId: Record<string, RouteSolutionStop>
  allIds: string[]
}
