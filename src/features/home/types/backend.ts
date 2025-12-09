export interface Coordinates {
  lat: number
  lng: number
}

export interface AddressPayload {
  raw_address: string
  street_address?: string | null
  city?: string | null
  country?: string | null
  postal_code?: string | null
  postalCode?: string | null
  coordinates?: Coordinates
}

export interface ChatNote {
  id: string
  author: string
  message: string
  created_at: string
  timestamp?: string
  sender?: string | number | null
  seenBy?: unknown[]
}

export interface TeamPayload {
  id: number
  name: string
}

export interface UserRolePayload {
  id: number
  role: string
  permissions: Record<string, boolean>
}

export interface UserPayload {
  id: number
  username: string
  email: string
  role: UserRolePayload
  team: TeamPayload
}

export interface ItemTypePayload {
  id: number
  name: string
}

export interface ItemCategoryPayload {
  id: number
  name: string
}

export interface ItemStatePayload {
  id: number
  name: string
  color: string
  priority?: number | null
}

export interface ItemPositionPayload {
  id: number
  name: string
}

export interface ItemPropertyRecord {
  state: string
  time: string
}

export interface ItemPayload {
  id: number
  article_number: string
  item_type: string | { id: number; name: string }
  item_category: string | { id: number; name: string }
  item_state_id: number
  item_position_id: number
  order_id: number
  properties: Record<string, string | number | boolean>
  weight: number
  dimensions: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  item_state_record: ItemPropertyRecord[]
  item_position_record: ItemPropertyRecord[]
  item_state?: ItemStatePayload
  item_position?: ItemPositionPayload
  item_valuation?: number | null
  page_link?: string
}

export interface OrderPayload {
  id: number
  arrival_time_range?: string | null
  client_first_name?: string
  client_last_name?: string
  client_email?: string | null
  client_primary_phone?: { prefix: string; number: string } | null
  client_secondary_phone?: { prefix: string; number: string } | null
  client_address: AddressPayload
  client_language: string
  notes_chat: ChatNote[]
  expected_arrival_time: string | null
  actual_arrival_time: string | null
  marketing_messages: boolean
  delivery_after?: string
  delivery_before?: string
  stop_time?: string
  in_range?: boolean
  delivery_arrangement?: number
  route_id?: number
  order_state?: string | null
  delivery_items: ItemPayload[]
  client_name?: string
  client_phones?: string[]
}

export interface RouteStatePayload {
  id: number
  name: string
}
export interface OptimizationOrderSequenceEntry {
  delivery_arrangement?: number
  expected_arrival_time?: string | null
}

export type OptimizationOrderSequence =
  | Record<string, OptimizationOrderSequenceEntry>
  | OptimizationOrderSequenceEntry[]
  | number[]

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

export interface RoutePayload {
  id: number
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
  delivery_orders: OrderPayload[]
  team?: TeamPayload
  is_unpack?: boolean
  total_orders?: number
  total_items?: number
  total_weight?: number
  total_volume?: number
  total_distance_meters?: number
  total_duration_seconds?: number
  delivery_time_range?: number
}

export interface RoutesPack {
  routes: RoutePayload[]
}

export interface EmailSmtpPayload {
  id: number
  smtp_server: string
  smtp_port: number
  smtp_username: string
  use_tls: boolean
  use_ssl: boolean
}

export interface TwilioPayload {
  id: number
  twilio_sid: string
  sender_number: string
}

export interface MessageTemplatePayload {
  id: number
  name: string
  channel: 'email' | 'sms'
  content: string
}

export interface NotificationSettingsPayload {
  email: EmailSmtpPayload
  sms: TwilioPayload
  templates: MessageTemplatePayload[]
}

export interface DeliveryDataset {
  team?: TeamPayload | null
  routes: RoutePayload[]
  users?: UserPayload[]
  notifications?: NotificationSettingsPayload
}

export interface IncomingPayloadRoutes{
  items: RoutePayload[]
  
}
