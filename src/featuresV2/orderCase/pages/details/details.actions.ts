import { useState } from "react"
import { useSectionManager } from '@/shared/resource-manager/useResourceManager'
import type { OrderCaseState } from "../../types"

import { useOrderCaseByClientId } from "../../store/orderCaseStore"
import { useOrderForCase } from "@/featuresV2/order"
import { useDetailsControllers } from "../../controllers/details.controllers"

export const useDetailsActions = (orderCaseClientId:string) =>{
    const orderCase = useOrderCaseByClientId(orderCaseClientId)
    const [ message, setMessage ] = useState('')
    const { updateState, sendChat } = useDetailsControllers()
    const { changeOrderOpenCasesCount } = useOrderForCase()
    const sectionManager = useSectionManager()

    const changeState = async (nextState: OrderCaseState)=>{
        if(!orderCase?.id) return

        const orderId = orderCase?.order_id
        const isNextResolved = Boolean(nextState == 'Resolved')

        if( isNextResolved ){
          changeOrderOpenCasesCount(orderId, -1)
          sectionManager.closeByKey('orderCase.details')
        }
        
        const success = await updateState(orderCase.id,nextState)

        if(!success && isNextResolved){
            changeOrderOpenCasesCount(orderId, 1)
        }
        
    }

    const addChat = async () =>{
        if(!orderCase?.id) return
        const previousMessage = message
        setMessage('')

        const success = await sendChat(orderCase.id, message)

        if(!success){
            setMessage(prev => previousMessage + '\t' + prev )
        }

    }

    return {
        changeState,
        addChat,
        setMessage,
        message,
    }
}