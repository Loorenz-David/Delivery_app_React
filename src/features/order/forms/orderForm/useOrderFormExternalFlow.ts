import { useCallback } from 'react'

import {
  emitExternalFormRequest,
  type ExternalFormReceivedPayload,
} from '@/realtime/externalForm/externalForm.realtime'
import { useExternalFormRealtime } from '@/realtime/externalForm/useExternalFormRealtime'
import { sessionStorage } from '@/features/auth/login/store/sessionStorage'

import { useOrderForm } from './OrderForm.context'

export type OrderFormExternalFlow = {
  employeeUserId: number
  handleSendForm: () => void
}

export const useOrderFormExternalFlow = (): OrderFormExternalFlow => {
  const { formState, formSetters } = useOrderForm()

  const session = sessionStorage.getSession()
  const employeeUserId = Number(
    session?.user?.id ?? (session as { userId?: string | number | null } | null)?.userId ?? -1,
  )

  const handleExternalFormReceived = useCallback(
    (payload: ExternalFormReceivedPayload) => {
      formSetters.mergeExternalClientData(payload.form_data)
    },
    [formSetters],
  )

  useExternalFormRealtime({
    userId: employeeUserId,
    onReceived: handleExternalFormReceived,
  })

  const handleSendForm = useCallback(() => {
    if (employeeUserId <= 0) {
      return
    }

    emitExternalFormRequest({
      user_id: employeeUserId,
      request_data: {
        reference_number: formState.reference_number,
      },
    })
  }, [employeeUserId, formState.reference_number])

  return {
    employeeUserId,
    handleSendForm,
  }
}
