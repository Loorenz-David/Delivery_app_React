import type { IncomingPayloadRoutes } from '../types/backend'

export const mockDeliveryDataset: IncomingPayloadRoutes = {
  
  items: [
    {
      id: 3102,
      route_label: 'Central Stockholms',
      delivery_date: '2025-10-27T08:00:00Z',
      arrival_time_range: 30,
      driver: {
        id: 10,
        username: 'John Smith',
        email: 'john.smith@beyo.app',
        role: {
          id: 1,
          role: 'driver',
          permissions: {
            canEditRoute: false,
            canSendBatchMessages: false,
            canEditOrder: false,
          },
        },
        team: { id: 401, name: 'Beyo Logistics' },
      },
      expected_start_time: '08:00',
      expected_end_time: '15:00',
      actual_start_time: undefined,
      actual_end_time: undefined,
      start_location: {
        city: 'Stockholm',
        raw_address: 'Sveavägen 44, Stockholm',
        street_address: 'Sveavägen 44',
        postal_code: '11134',
        coordinates: { lat: 59.347, lng: 18.057 },
      },
      end_location: {
        city: 'Stockholm',
        raw_address: 'Årstaängsvägen 21, Stockholm',
        street_address: 'Årstaängsvägen 21',
        postal_code: '11743',
        coordinates: { lat: 59.302, lng: 18.027 },
      },
      saved_optimizations: [
        {
          id: 'opt-default',
          created_at: '2025-10-20T09:00:00Z',
          stops: 8,
          distance_km: 52.3,
          total_distance_meters: 0,
          total_duration_seconds: 0,
          expected_start_time: null,
          expected_end_time: null,
          set_start_time: null,
          set_end_time: null,
          start_location: {
            raw_address: 'Sveavägen 44, Stockholm',
            city: 'Stockholm',
            postal_code: '11134',
            coordinates: { lat: 59.347, lng: 18.057 },
          },
          end_location: {
            raw_address: 'Årstaängsvägen 21, Stockholm',
            city: 'Stockholm',
            postal_code: '11743',
            coordinates: { lat: 59.302, lng: 18.027 },
          },
          order_sequence: [],
          skipped_shipments: [],
          polylines: {},
          consider_traffic: false,
        },
      ],
      using_optimization_indx: 0,
      state_id: 1,
      is_optimized: true,
      route_state: {
        id: 1,
        name: 'Pending',
      },
      delivery_orders: [
        buildOrder(1, 'Christina Berg', 'Norrlandsgatan 18', '10:00', {
          after: '08:00',
          before: '12:00',
        }),
        buildOrder(2, 'Daniel Ek', 'Birger Jarlsgatan 25', '11:00'),
        buildOrder(3, 'Emma Franzén', 'Hamngatan 27', '12:00', { before: '14:00' }),
        buildOrder(4, 'Fredrik Hallberg', 'Biblioteksgatan 5', '13:00'),
        buildOrder(5, 'Gabriella Lind', 'Sturegatan 14', '14:00'),
        buildOrder(6, 'Malin Hedlund', 'Kungsholmsgatan 45', '15:00'),
      ],
      team: { id: 401, name: 'Beyo Logistics' },
    },
  ],
  
}



function buildOrder(position: number, name: string, street: string, etaHour: string, window?: { after?: string; before?: string }) {
  const id = 7200 + position
  return {
    id,
    client_name: name,
    client_phones: ['+46702444000'],
    client_address: {
      city: 'Stockholm',
      raw_address: `${street}, Stockholm`,
      street_address: `${street}, Stockholm`,
      postal_code: '11130',
      coordinates: waypoint(position),
    },
    client_language: 'sv',
    notes_chat: position === 1 ? [chatNote('Please call 10 minutes before arrival.')] : [],
    expected_arrival_time: `2025-10-27T${etaHour}:00Z`,
    actual_arrival_time: null,
    marketing_messages: false,
    delivery_after: window?.after,
    delivery_before: window?.before,
    stop_time: '10m',
    in_range: true,
    delivery_arrangement: position,
    route_id: 3101,
    delivery_items: [
      buildItem(`TV-${position}`, id),
      buildItem(`SND-${position}`, id, 'Soundbar'),
    ],
  }
}

function buildItem(articleNumber: string, orderId: number, label = 'Television') {
  return {
    id: Number(`${orderId}${articleNumber.replace(/\D/g, '') || 0}`),
    article_number: articleNumber,
    item_type: { id: 1, name: 'Electronics' },
    item_category: { id: 1, name: 'Home Entertainment' },
    item_state: { id: 1, name: 'Pending', color: '#FACC15' },
    item_position: { id: 1, name: 'Warehouse' },
    item_state_id: 1,
    item_position_id: 1,
    order_id: orderId,
    properties: { label, fragile: articleNumber.includes('TV') },
    weight: articleNumber.includes('TV') ? 25 : 12,
    dimensions: { length_cm: 120, width_cm: 30, height_cm: 80 },
    item_state_record: [
      { state: 'Pending', time: '2025-10-25T08:00:00Z' },
      { state: 'Ready for Dispatch', time: '2025-10-26T14:00:00Z' },
    ],
    item_position_record: [
      { state: 'Warehouse', time: '2025-10-24T08:00:00Z' },
      { state: 'Loading Dock', time: '2025-10-27T07:30:00Z' },
    ],
  }
}

function waypoint(position: number) {
  const orderWaypoints = [
    { lat: 59.338, lng: 18.063 },
    { lat: 59.341, lng: 18.067 },
    { lat: 59.334, lng: 18.075 },
    { lat: 59.332, lng: 18.078 },
    { lat: 59.336, lng: 18.081 },
    { lat: 59.337, lng: 18.054 },
  ]
  return orderWaypoints[(position - 1) % orderWaypoints.length]
}

function chatNote(message: string) {
  return {
    id: crypto.randomUUID(),
    author: 'Dispatcher',
    message,
    created_at: new Date().toISOString(),
  }
}
