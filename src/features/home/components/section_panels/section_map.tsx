
import OrdersSection from './OrdersSection.tsx'
import SingleOrder from './SingleOrder.tsx'
import ItemSection  from './ItemSection'
import RouteOptimizationSection from './RouteOptimizationSection'
import RouteStatsSection from './RouteStatsSection'
import ChatSection from './OrderChatSection.tsx'

export const sectionMap = {
    'OrdersSection':OrdersSection,
    'SingleOrder':SingleOrder,
    'ItemSection': ItemSection,
    'RouteOptimizationSection': RouteOptimizationSection,
    'RouteStatsSection': RouteStatsSection,
    'ChatSection': ChatSection,
}
