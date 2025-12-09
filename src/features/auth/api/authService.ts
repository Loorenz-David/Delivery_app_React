import { apiClient } from '../../../lib/api/ApiClient'
import type { LoginPayload, LoginResponse, RegisterPayload } from '../types'

class AuthService {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.request<LoginResponse>({
      path: '/auth/login',
      method: 'POST',
      data: payload,
      requiresAuth: false,
    })

    return response.data
  }

  async register(payload: RegisterPayload): Promise<unknown> {
    const response = await apiClient.request({
      path: '/user/register_user',
      method: 'POST',
      data: payload,
      requiresAuth: false,
    })

    return response.data
  }
}

export const authService = new AuthService()
