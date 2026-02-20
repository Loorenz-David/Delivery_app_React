import type { Item } from './itemTypes'
import type { EntityTable } from '../../StoreFactory'

import { selectById, selectAll } from '../../entitySelectors'
import { useOrderStore } from '../orders/orderStore'


export const selectItemById = (id: number | null | undefined) =>
    (state:EntityTable<Item>) =>
        selectById<Item>(id)(state)

export const selectAllItems = () =>
        (state: EntityTable<Item>) =>
            selectAll<Item>()(state)

export const selectOrderForItem = 
    ( itemId: number ) =>
        ( itemState: EntityTable<Item> ) => { 
            const item = itemState.byId[ itemId ]
            const itemOrderId = item?.order_id
            if ( !item || typeof itemOrderId !== 'number' ) return null

            const ordersById = useOrderStore.getState().byId

            return  ordersById[ itemOrderId ] ?? null
        }
    