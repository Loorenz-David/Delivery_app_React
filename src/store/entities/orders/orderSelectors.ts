import type { Order } from './orderTypes'
import type { EntityTable } from '../../StoreFactory'

import { selectAll, selectById } from '../../entitySelectors'
import { useItemStore } from '../items/itemStore'

export const selectAllOrders = 
    ( orderState: EntityTable<Order> ) =>
        selectAll<Order>()(orderState)

export const selectOderById = 
    (orderId: number | null | undefined) =>
        ( orderState: EntityTable<Order> ) =>
            selectById<Order>( orderId )( orderState )

export const selectItemsForOrder =
    ( orderId: number ) =>
        ( orderState: EntityTable<Order> ) =>{
            const order = orderState.byId[ orderId ]
            if ( !order ) return []
            
            const itemsById = useItemStore.getState().byId

            return order.ItemIds.map( (ItemId)=> itemsById[ItemId] )
        }
            