import { useEffect } from 'react'

import { connectSocket } from '../core/socket.manager'
import {
  joinExternalFormUserRoom,
  leaveExternalFormUserRoom,
  subscribeToExternalFormReceived,
  subscribeToExternalFormRequested,
  unsubscribeFromExternalFormReceived,
  unsubscribeFromExternalFormRequested,
  type ExternalFormReceivedPayload,
  type ExternalFormRequestedPayload,
} from './externalForm.realtime'

export const useExternalFormRealtime = ({
  userId,
  onReceived,
  onRequested,
}: {
  userId: number
  onReceived?: (payload: ExternalFormReceivedPayload) => void
  onRequested?: (payload: ExternalFormRequestedPayload) => void
}) => {
  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      return
    }

    connectSocket()
    joinExternalFormUserRoom(userId)
    if (onReceived) {
      subscribeToExternalFormReceived(onReceived)
    }
    if (onRequested) {
      subscribeToExternalFormRequested(onRequested)
    }

    return () => {
      leaveExternalFormUserRoom(userId)
      if (onReceived) {
        unsubscribeFromExternalFormReceived(onReceived)
      }
      if (onRequested) {
        unsubscribeFromExternalFormRequested(onRequested)
      }
    }
  }, [onReceived, onRequested, userId])
}
