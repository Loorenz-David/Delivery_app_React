import type { PropsWithChildren } from 'react'
import { CaseMainContext } from './caseMain.context'
import { useCaseMainActions } from '../../pages/main/main.actions'

import { useOrderCaseMainFlow } from '../../flows/orderCasePages.flow'


type CaseMainProviderProps = PropsWithChildren<{
    
}>


export const CaseMainProvider = ({ children }:CaseMainProviderProps)=>{
    const caseMainActions = useCaseMainActions()
    const {cases, query} = useOrderCaseMainFlow()

    const value = {
        cases,
        query,
        caseMainActions,
    }


    return (
        <CaseMainContext.Provider value={value}>
            {children}
        </CaseMainContext.Provider>
    )
}