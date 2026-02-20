import type { PropsWithChildren } from 'react'
import { CaseOrderContext } from './caseOrder.context'
import { useCaseOrderActions } from '../../pages/order/order.actions'
import { useOrderCasesByOrderFlow } from '../../flows/orderCasePages.flow'



type CaseOrderProviderProps = PropsWithChildren<{
    orderId: number
}>


export const CaseOrderProvider = ({ children, orderId }:CaseOrderProviderProps)=>{

    const {cases} = useOrderCasesByOrderFlow(orderId)

    const caseOrderActions = useCaseOrderActions()

    const value = {
        cases,
        caseOrderActions,
    }


    return (
        <CaseOrderContext.Provider value={value}>
            {children}
        </CaseOrderContext.Provider>
    )
}