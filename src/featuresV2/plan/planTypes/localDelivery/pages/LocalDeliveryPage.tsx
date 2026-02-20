import { LocalDeliveryProvider } from '../context/LocalDeliveryProvider'
import { LocalDeliveryPageContent } from './LocalDeliveryPageContent'

type PlanOrdersPagePayload = {
  planId?: number 
}

type LocalDeliveryPageProps = {
  payload: PlanOrdersPagePayload
}




export const LocalDeliveryPage = ({ payload }: LocalDeliveryPageProps) => {
  const planId = payload?.planId
  if (planId == null) return null

  return (
    <LocalDeliveryProvider planId={planId}>
      <LocalDeliveryPageContent />
    </LocalDeliveryProvider>
  )
}
