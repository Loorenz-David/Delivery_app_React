import type { Order } from './orderTypes'

import { createEntityStore } from '../../StoreFactory'


export const useOrderStore = createEntityStore<Order>()