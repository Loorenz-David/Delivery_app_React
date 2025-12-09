import type { SessionStorage, SessionSnapshot } from '../storage/sessionStorage'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiEnvelope<T = unknown> {
  status: number
  message: string
  error: string | null
  data: T
  is_compress: boolean
}

export interface ApiResult<T> {
  data: T
  status: number
  message: string
  error: string | null
  envelope: ApiEnvelope<T>
}

export interface RequestOptions<TBody = unknown> {
  path: string
  method?: HttpMethod
  data?: TBody
  compress?: boolean
  headers?: Record<string, string>
  signal?: AbortSignal
  requiresAuth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
}

export interface ApiClientOptions {
  baseUrl: string
  refreshPath: string
  sessionStorage: SessionStorage
  onUnauthenticated?: () => void
  fetchImpl?: typeof fetch
}

export type SessionAccessor = Pick<SessionStorage, 'getSession' | 'setSession' | 'clear'>

export type SessionUpdater = (session: SessionSnapshot | null) => void

