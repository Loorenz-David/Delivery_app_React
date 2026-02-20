import type { SessionUser } from '@/featuresV2/auth/login/store/sessionStorage'

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  socket_token?: string
  user?: SessionUser | null
}
