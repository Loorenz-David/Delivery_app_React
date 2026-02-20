import type { Route } from './routeTypes'
import type { EntityTable } from '../../StoreFactory'

import { selectAll, selectById } from '../../entitySelectors'
import { useOrderStore } from '../orders/orderStore'

export const selectAllRoutes = 
    ( routeState: EntityTable<Route> ) =>
        selectAll<Route>()(routeState)

export const selectRouteById = 
    (routeId: number | null | undefined) =>
        ( routeState: EntityTable<Route> ) =>
            selectById<Route>( routeId )( routeState )

export const selectOrdersForRoute =
    ( routeId: number ) =>
        ( routeState: EntityTable<Route> ) =>{
            const route = routeState.byId[ routeId ]
            if ( !route ) return []
            
            const ordersById = useOrderStore.getState().byId

            return route.OrderIds.map( (OrderId)=> ordersById[OrderId] )
        }
            