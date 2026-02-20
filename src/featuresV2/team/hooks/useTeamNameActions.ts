import { useCallback } from 'react'

import { useMessageManager } from '@/message_manager'
import { sessionStorage } from '@/featuresV2/auth/login/store/sessionStorage'
import { apiClient } from '@/lib/api/ApiClient'

import { useUpdateTeamName } from '../members/api/teamMemberApi'

export const useTeamNameActions = () => {
  const { showMessage } = useMessageManager()
  const updateTeamNameRequest = useUpdateTeamName()

  const updateTeamName = useCallback(async (name: string) => {
    try {
      await updateTeamNameRequest(name)
      const session = sessionStorage.getSession()
      if (session?.user) {
        apiClient.setSession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          socketToken: session.socketToken,
          identity: session.identity,
          user: {
            ...session.user,
            team_name: name,
          },
        })
      }
      return true
    } catch (error) {
      console.error('Failed to update team name', error)
      showMessage({ status: 500, message: 'Unable to update team name.' })
      return false
    }
  }, [showMessage, updateTeamNameRequest])

  return { updateTeamName }
}
