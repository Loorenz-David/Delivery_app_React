import { useCallback, useMemo } from "react"

import { useSectionManager } from "@/shared/resource-manager/useResourceManager"
import { selectOrderCaseByClientId,  useOrderCaseStore } from "../../store/orderCaseStore"

import { useCaseOrderController } from "../../controllers/order.controllers"
import { apiClient } from "@/lib/api/ApiClient"
import { useOrderCaseModel } from "../../domain/orderCase.model"
import { useOrderForCase } from "@/featuresV2/order/hooks/useOrderCase"



export const useCaseOrderActions = ()=>{

    const sectionManager = useSectionManager()

    const { createCase, deleteCase } = useCaseOrderController()
    const { buildInitialCase }= useOrderCaseModel()
    const { changeOrderOpenCasesCount } = useOrderForCase()


    const sessionUserId = useMemo(()=>{
        const userId =apiClient.getSessionUserId()
        if( typeof userId !== "number" ) return null
        return userId
    },[])


    const openCaseDetails = useCallback(
        (orderCaseClientId: string) => {
          sectionManager.open({
            key: 'orderCase.details',
            payload: { orderCaseClientId },
          })
        },
        [sectionManager],
    )

    const createOpenCase = async (orderId:number)=>{

        const newCase = buildInitialCase(orderId, sessionUserId)

        changeOrderOpenCasesCount(orderId, 1)
        const success = await createCase(newCase)

        if (!success ){
            changeOrderOpenCasesCount(orderId, -1)
            return
        }

        openCaseDetails(newCase.client_id)


    }

    const removeCase = async (caseClientId:string)=>{
        const current = selectOrderCaseByClientId(caseClientId)(useOrderCaseStore.getState())
        if(!current) return

        const isOpenCase = current.state !== 'Resolved'

        if(isOpenCase){
            changeOrderOpenCasesCount(current.order_id, -1)
        }

        const success = await deleteCase(caseClientId)
        if (!success && isOpenCase ){
            changeOrderOpenCasesCount(current.order_id, 1)
        }
    }


    return {
        openCaseDetails,
        createOpenCase,
        removeCase
    }
}