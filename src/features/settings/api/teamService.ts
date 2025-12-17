import { apiClient } from '../../../lib/api/ApiClient'
import type { ApiResult } from '../../../lib/api/types'
import type { QueryResponse } from './accountService'
import type { SettingsUserRole, TeamInviteReceived, TeamInviteSent, TeamInfo } from '../types'

export interface SendInvitePayload {
  username: string
  email: string
  role_id?: number | null
}

export interface InviteActionPayload {
  invitation_instance_id: number
  action: 'accept' | 'reject'
}

export interface DeleteInvitePayload {
  sent_invite_id: number
}

export interface KickUserPayload {
  username: string
  email: string
}

export interface UpdateTeamPayload {
  id: number
  fields: Partial<Pick<TeamInfo, 'name'>>
}

export class TeamService {
  async fetchTeam(): Promise<ApiResult<QueryResponse<TeamInfo>>> {
    return apiClient.request<QueryResponse<TeamInfo>>({
      path: '/user/query_team',
      method: 'POST',
      data: { query: {} },
    })
  }

  async updateTeam(payload: UpdateTeamPayload): Promise<ApiResult<{ instance: TeamInfo } | TeamInfo>> {
    return apiClient.request<{ instance: TeamInfo } | TeamInfo>({
      path: '/user/update_team',
      method: 'PUT',
      data: payload,
    })
  }

  async fetchUserRoles(): Promise<ApiResult<QueryResponse<SettingsUserRole>>> {
    return apiClient.request<QueryResponse<SettingsUserRole>>({
      path: '/user/query_user_role',
      method: 'POST',
      data: { query: {} },
    })
  }

  async fetchSentInvitations(): Promise<ApiResult<{ items: TeamInviteSent[] }>> {
    return apiClient.request<{ items: TeamInviteSent[] }>({
      path: '/user/get_sent_invitations',
      method: 'GET',
    })
  }

  async fetchReceivedInvitations(): Promise<ApiResult<{ items: TeamInviteReceived[] }>> {
    return apiClient.request<{ items: TeamInviteReceived[] }>({
      path: '/user/get_received_invitations',
      method: 'GET',
    })
  }

  async sendInvitation(payload: SendInvitePayload): Promise<ApiResult<{ invite_id: number }>> {
    return apiClient.request<{ invite_id: number }>({
      path: '/user/send_team_invitation',
      method: 'POST',
      data: payload,
    })
  }

  async respondToInvitation(payload: InviteActionPayload): Promise<ApiResult<unknown>> {
    return apiClient.request({
      path: '/user/interactions_invites_received',
      method: 'POST',
      data: payload,
    })
  }

  async deleteSentInvitation(payload: DeleteInvitePayload): Promise<ApiResult<unknown>> {
    return apiClient.request({
      path: '/user/delete_invites_sent',
      method: 'DELETE',
      data: payload,
    })
  }

  async leaveTeam(): Promise<ApiResult<unknown>> {
    return apiClient.request({
      path: '/user/leave_team',
      method: 'POST',
    })
  }

  async kickUser(payload: KickUserPayload): Promise<ApiResult<unknown>> {
    return apiClient.request({
      path: '/user/kick_user_from_team',
      method: 'POST',
      data: payload,
    })
  }
}
