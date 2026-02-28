


import { LocalDeliveryOrderList, MainHeaderLocalDeliveryPage } from '../components'
import { useLocalDeliveryContext } from '../context/useLocalDeliveryContext'


export const LocalDeliveryPageContent = () => {
  const { plan, orderCount, localDeliveryPlan, localDeliveryActions, selectedRouteSolution } = useLocalDeliveryContext()



  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-primary)]/5">
      <MainHeaderLocalDeliveryPage
        localDeliveryActions={localDeliveryActions}
        localDeliveryPlan={localDeliveryPlan}
        orderCount={orderCount}
        selectedRouteSolution={selectedRouteSolution}
        plan={plan}
      />
      <LocalDeliveryOrderList localDeliveryActions={localDeliveryActions}/>
      
    </div>
  )
}
