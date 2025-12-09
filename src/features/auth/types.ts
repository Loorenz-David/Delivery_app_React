import type { SessionUser } from '../../lib/storage/sessionStorage'

export interface AuthUser extends SessionUser {}



export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name?: string
  team?: {name:string}
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string | number
    email: string
  }
}
