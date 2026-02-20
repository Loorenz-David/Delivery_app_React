import type { Route } from './routeTypes'

import { createEntityStore } from '../../StoreFactory'


export const useRouteStore = createEntityStore<Route>()