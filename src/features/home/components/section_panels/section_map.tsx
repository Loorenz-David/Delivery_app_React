
import OrdersSection from './OrdersSection.tsx'
import SingleOrder from './SingleOrder.tsx'
import ItemSection  from './ItemSection'
import RouteOptimizationSection from './RouteOptimizationSection'
import RouteStatsSection from './RouteStatsSection'
import ChatSection from './OrderChatSection.tsx'
import type {ComponentType} from 'react'

export const sectionMap: Record<string,ComponentType<any>> = {
    'OrdersSection':OrdersSection,
    'SingleOrder':SingleOrder,
    'ItemSection': ItemSection,
    'RouteOptimizationSection': RouteOptimizationSection,
    'RouteStatsSection': RouteStatsSection,
    'ChatSection': ChatSection,
}
