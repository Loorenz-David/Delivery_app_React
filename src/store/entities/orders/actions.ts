
import { useRouteStore } from '../routes/routeStore'
import { useOrderStore } from './orderStore'


const actionMessage = (
    status='ok', 
    message=''
) =>{
    return {status, message}
}

interface MoveOrder {
    orderId: number
    fromRouteId?: number | null
    toRouteId?: number | null
}
export const moveOrderToRoute = ({
    orderId,
    fromRouteId,
    toRouteId 
}: MoveOrder) => {
        
        const orders = useOrderStore.getState()
        const routes = useRouteStore.getState()
        const order = orders.byId[orderId]

        if ( !order ) return actionMessage('fail', 'Order id not found in orders store')

        if ( fromRouteId === toRouteId ) return actionMessage('ok', 'Order already in target route')

        if ( typeof fromRouteId === 'number' ){
            routes.update( fromRouteId, (r) => ({
                ...r,
                OrderIds: r.OrderIds.filter( (id) => id !== orderId )
            }))
        }
        if (typeof toRouteId === 'number' ){
            routes.update( toRouteId, (r)=>({
                ...r,
                OrderIds: [ ...r.OrderIds, orderId ]
            }))
        }
        orders.update( orderId, (o)=>({
            ...o,
            route_id: toRouteId
        }))

        return actionMessage()
    }
