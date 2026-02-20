import { useCallback } from 'react'

import { buildClientId } from '@/lib/utils/clientId'
import { useMessageManager } from '@/message_manager'
import { usePopupManager } from '@/shared/resource-manager/useResourceManager'

import { useCreateTeamInvite } from '@/featuresV2/team/invitations/api/teamInvitationApi'
import type { TeamInviteCreatePayload, TeamInviteSent } from '@/featuresV2/team/invitations/types/teamInvitation'
import {
  insertTeamInviteSent,
  removeTeamInviteSent,
  updateTeamInviteSent,
} from '@/featuresV2/team/invitations/store/teamInvitesSentStore'

export const useTeamInvitationController = () => {
  const createInvite = useCreateTeamInvite()
  const { showMessage } = useMessageManager()
  const popupManager = usePopupManager()

  const sendInvitation = useCallback(
    async (payload: TeamInviteCreatePayload) => {
      const clientId = payload.client_id || buildClientId('team_invite')
      const optimisticInvite: TeamInviteSent = {
        client_id: clientId,
        target_username: payload.target_user.username,
        target_email: payload.target_user.email,
        user_role_name: payload.user_role_name,
        creation_date: new Date().toISOString(),
      }

      insertTeamInviteSent(optimisticInvite)

      try {
        const response = await createInvite({ ...payload, client_id: clientId })
        const inviteId = response.data?.team_invites?.[clientId]

        if (typeof inviteId === 'number') {
          updateTeamInviteSent(clientId, (invite) => ({
            ...invite,
            id: inviteId,
          }))
        }

        popupManager.closeByKey('team.invite.create')
        return true
      } catch (error) {
        let message = 'Unable to send invitation.' 
        console.error('Failed to create team invitation', error)
        removeTeamInviteSent(clientId)
        if (error instanceof Error){
          message = error.message
        }
        showMessage({ status: 500, message: message})
        return false
      }
    },
    [createInvite, popupManager, showMessage],
  )

  return { sendInvitation }
}
