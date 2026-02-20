import { useCallback } from 'react'

import { useMessageManager } from '@/message_manager'
import { ApiError } from '@/lib/api/ApiClient'
import { insertOrderStates } from '@/featuresV2/order/store/orderStateStore'
import { insertTeamMembers } from '@/featuresV2/team/members/store/teamMemberStore'

import { bootstrapApi } from './bootstrp.api'
import { insertItemStates } from '../itemConfigurations/store/itemStateStore'
import { insertPrintTemplates } from '../templates/printDocument/store'
import { insertEmailMessages } from '../messaging/emailMessage/store'
import { insertSmsMessages } from '../messaging/smsMessage/store'
import { insertDeliveryPlanStates } from '../plan/store/planStateStore'




export function useBootstrap() {
  const { showMessage } = useMessageManager()

  const fetchBootstrap = useCallback(
    async () => {
      try {
        const response = await bootstrapApi.listBootstrap()
        const payload = response.data

        if (!payload) {
          console.warn('Bootstrap response missing payload', payload)
          return null
        }
      
        
        if (payload.item_states) {
          insertItemStates(payload.item_states)
        }

        if (payload.order_states) {
          insertOrderStates(payload.order_states)
        }

        
        if (payload.team_members) {
          insertTeamMembers(payload.team_members)
        }
        
        if (payload.label_templates) {
          insertPrintTemplates(payload.label_templates)
        }
        
        if (payload.message_templates_email) {
          insertEmailMessages(payload.message_templates_email)
        }
        if (payload.message_templates_sms) {
          insertSmsMessages(payload.message_templates_sms)
        }

        if (payload.plan_states) {
          insertDeliveryPlanStates(payload.plan_states)
        }

        return payload
      } catch (error) {
        const message = error instanceof ApiError
          ? error.message
          : 'Unable to load bootstrap data.'
        const status = error instanceof ApiError ? error.status : 500
        console.error('Failed to fetch bootstrap data', error)
        showMessage({ status, message })
        return null
      }
    },
    [showMessage],
  )

  return { fetchBootstrap }
}
