import { useMemo, type PropsWithChildren } from 'react'
import { useDetailsActions } from '../../pages/details/details.actions'
import { DetailsCaseContext } from './caseDetails.context'
import { apiClient } from '@/lib/api/ApiClient'

import { useOrderCaseDetailsFlow } from '../../flows/orderCasePages.flow'

type CaseDetailsPageProviderProps = PropsWithChildren<{
  orderCaseClientId: string
}>

export const CaseDetailsPageProvider = ({
  children,
  orderCaseClientId,
}: CaseDetailsPageProviderProps) => {

  const {orderCase} = useOrderCaseDetailsFlow(orderCaseClientId)

  
  const detailsActions = useDetailsActions(orderCaseClientId)
  
  
  const currentUserId = useMemo(() => {
    const userId = apiClient.getSessionUserId()
    if( typeof userId !== 'number') return null
    return userId
  }, [])


  const value = {
    orderCase,
    detailsActions,
    currentUserId

  }

  return (
    <DetailsCaseContext.Provider value={value}>
      {children}
    </DetailsCaseContext.Provider>
    )
}
