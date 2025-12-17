import { apiClient } from '../../../lib/api/ApiClient'
import type { ApiResult } from '../../../lib/api/types'
import type { PhoneValue } from '../../../components/forms/PhoneField'

export interface QueryResponse<T> {
  items: T[]
  total?: number
}

export interface AccountTeamPayload {
  id: number
  name: string
}

export interface AccountRolePayload {
  id: number
  role: string
}

export interface UserAccountPayload {
  id: number
  username: string
  email: string
  phone_number?: PhoneValue | null
  profile_picture?: unknown
  role?: AccountRolePayload | null
  team?: AccountTeamPayload | null
}

export interface UpdateUserPayload {
  id: number
  fields: Partial<{
    username: string
    email: string
    phone_number: PhoneValue | null
    profile_picture: unknown
    password: string
    role_id: number | null
  }>
}

export interface UpdatePasswordPayload {
  id: number
  password: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  phone_number?: PhoneValue | null
  role_id?: number | null
  team_id?: number | null
}

export class AccountSettingsService {
  async fetchUserById(userId: number | string): Promise<ApiResult<QueryResponse<UserAccountPayload>>> {
    return apiClient.request<QueryResponse<UserAccountPayload>>({
      path: '/user/query_user',
      method: 'POST',
      data: {
        query: {
          id: {
            operation: '==',
            value: userId,
          },
        },
      },
    })
  }

  async fetchUsers(query?: Record<string, unknown>): Promise<ApiResult<QueryResponse<UserAccountPayload>>> {
    return apiClient.request<QueryResponse<UserAccountPayload>>({
      path: '/user/query_user',
      method: 'POST',
      data: {
        query: query ?? {},
      },
    })
  }

  async createUser(payload: CreateUserPayload): Promise<ApiResult<UserAccountPayload | { instance: UserAccountPayload }>> {
    return apiClient.request<UserAccountPayload | { instance: UserAccountPayload }>({
      path: '/user/create_user',
      method: 'POST',
      data: payload,
    })
  }

  async updateUser(payload: UpdateUserPayload): Promise<ApiResult<UserAccountPayload | { instance: UserAccountPayload }>> {
    return apiClient.request<UserAccountPayload | { instance: UserAccountPayload }>({
      path: '/user/update_user',
      method: 'PUT',
      data: payload,
    })
  }

  async updatePassword(payload: UpdatePasswordPayload) {
    return this.updateUser({
      id: payload.id,
      fields: {
        password: payload.password,
      },
    })
  }
}
