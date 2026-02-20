import type { Item } from './itemTypes'

import { createEntityStore } from '../../StoreFactory'

export const useItemStore = createEntityStore<Item>()