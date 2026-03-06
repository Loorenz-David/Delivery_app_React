import type { Order } from '../../types/order'

import { buildOrderMarkers } from '../orderMapMarkers.flow'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const createOrder = (overrides?: Partial<Order>): Order => ({
  client_id: 'order-1',
  client_address: {
    street_address: '123 Main St',
    city: 'Miami',
    country: 'US',
    postal_code: '33101',
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  ...overrides,
})

export const runOrderMapMarkersFlowTests = () => {
  {
    const { markers } = buildOrderMarkers({
      orders: [
        createOrder({ client_id: 'valid-1' }),
        createOrder({ client_id: 'invalid-no-address', client_address: null }),
        createOrder({
          client_id: 'invalid-lat',
          client_address: {
            street_address: 'X',
            coordinates: { lat: Number.NaN, lng: -80.1 },
          },
        }),
      ],
      markerClassName: 'order-marker',
      onMarkerClick: () => undefined,
    })

    assert(markers.length === 1, 'should filter out orders without valid coordinates')
    assert(markers[0].id === 'valid-1', 'should keep valid order marker id')
  }

  {
    const { markers } = buildOrderMarkers({
      orders: [createOrder({ client_id: 'styled-order' })],
      markerClassName: 'order-marker',
      onMarkerClick: () => undefined,
    })

    assert(markers.length === 1, 'should return one marker')
    assert(markers[0].id === 'styled-order', 'should set marker id from client_id')
    assert(markers[0].className === 'order-marker', 'should set marker class from payload')
    assert(markers[0].interactionVariant === 'order', 'order markers should use order interaction variant')
    assert(markers[0].label === undefined, 'plain order markers should not include label')
    assert(markers[0].coordinates.lat === 25.7617, 'should preserve latitude')
    assert(markers[0].coordinates.lng === -80.1918, 'should preserve longitude')
  }

  {
    let clickedOrderClientId: string | null = null
    const clickEvent = {} as MouseEvent

    const { markers } = buildOrderMarkers({
      orders: [createOrder({ client_id: 'click-target' })],
      markerClassName: 'order-marker',
      onMarkerClick: (_event, order) => {
        clickedOrderClientId = order.client_id
      },
    })

    markers[0].onClick(clickEvent)
    assert(clickedOrderClientId === 'click-target', 'marker click should forward the exact order')
  }

  {
    const { markers, lookup } = buildOrderMarkers({
      orders: [
        createOrder({
          client_id: 'group-a',
          id: 101,
          client_address: {
            street_address: 'Same Address',
            coordinates: { lat: 25.7617, lng: -80.1918 },
          },
        }),
        createOrder({
          client_id: 'group-b',
          id: 102,
          client_address: {
            street_address: 'Same Address',
            coordinates: { lat: 25.761704, lng: -80.191804 },
          },
        }),
      ],
      markerClassName: 'order-marker',
      onMarkerClick: () => undefined,
    })

    assert(markers.length === 1, 'same-address orders should render a single grouped marker')
    assert(markers[0].label === '2', 'grouped marker should display grouped order count label')

    const markerId = String(markers[0].id)
    assert(
      lookup.markerOrderClientIdsByMarkerId[markerId]?.length === 2,
      'lookup should map grouped marker to all grouped order client ids',
    )
    assert(
      lookup.markerIdByOrderClientId['group-a'] === markerId && lookup.markerIdByOrderClientId['group-b'] === markerId,
      'lookup should map each grouped order client id back to grouped marker id',
    )
  }
}
