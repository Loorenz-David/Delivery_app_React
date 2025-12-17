import { compressPayload, maybeDecompress } from './compression'
import type { ApiClientOptions, ApiEnvelope, ApiResult, RequestOptions } from './types'

import type { SessionSnapshot } from '../storage/sessionStorage'
import { sessionStorage } from '../storage/sessionStorage'

export class ApiError extends Error {
  public readonly status: number
  public readonly envelope?: ApiEnvelope<unknown>

  constructor(message: string, status: number, envelope?: ApiEnvelope<unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.envelope = envelope
  }
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly refreshPath: string
  private readonly fetchImpl: typeof fetch
  private refreshPromise: Promise<boolean> | null = null
  private options: ApiClientOptions

  constructor(options: ApiClientOptions) {
    this.options = options
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.refreshPath = options.refreshPath
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis)
  }

  setUnauthenticatedHandler(handler?: () => void): void {
    this.options.onUnauthenticated = handler
  }

  getAccessToken(): string | null {
    return this.options.sessionStorage.getSession()?.accessToken ?? null
  }

  getRefreshToken(): string | null {
    return this.options.sessionStorage.getSession()?.refreshToken ?? null
  }

  getSocketToken(): string | null {
    return this.options.sessionStorage.getSession()?.socketToken ?? null
  }

  getSessionUserId(): string | number | null {
    const session = this.options.sessionStorage.getSession()
    return session?.user?.id ?? null
  }

 
  async request<T>(options: RequestOptions, attempt = 0): Promise<ApiResult<T>> {
    const {
      path,
      method = 'GET',
      data,
      compress = false, 
      headers = {},
      signal,
      requiresAuth = true,
      query,
    } = options

    const url = this.composeUrl(path, query)
    const session = this.options.sessionStorage.getSession()
    
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (requiresAuth && session?.accessToken) {
      finalHeaders.Authorization = `Bearer ${session.accessToken}`
    }

    const body =
      data === undefined
        ? undefined
        : JSON.stringify({
            data: compress ? compressPayload(data) : data,
            is_compress: compress,
          })

    const response = await this.fetchImpl(url, {
      method,
      headers: finalHeaders,
      body,
      signal,
    })

    const rawText = await response.text()
    const envelope = rawText ? (JSON.parse(rawText) as ApiEnvelope<unknown>) : undefined
    if ((response.status === 403 || response.status == 422) && requiresAuth) {
      if (attempt === 0 && (await this.tryRefresh())) {

        return this.request(options, attempt + 1)
      }

      this.handleUnauthenticated()
      throw new ApiError(envelope?.message || 'Unauthorized', response.status, envelope)
    }

    if (!response.ok) {
      throw new ApiError(envelope?.error || envelope?.message || 'Request failed', response.status, envelope)
    }

    if (!envelope) {
      throw new ApiError('Empty response from server', response.status)
    }

    const dataPayload = maybeDecompress<T>(envelope.data, envelope.is_compress)

    const typedEnvelope = envelope as ApiEnvelope<T>

    return {
      data: dataPayload,
      status: typedEnvelope.status,
      message: typedEnvelope.message,
      error: typedEnvelope.error,
      envelope: typedEnvelope,
    }
  }

  private composeUrl(path: string, query?: RequestOptions['query']): string {
    const trimmedPath = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

    if (!query) {
      return trimmedPath
    }

    const queryString = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')

    return queryString ? `${trimmedPath}?${queryString}` : trimmedPath
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const existing = this.options.sessionStorage.getSession()
    console.log(existing)
    if (!existing?.refreshToken) {
      return false
    }

    const { refreshToken } = existing
    console.log(refreshToken)
    this.refreshPromise = (async () => {
      const response = await this.fetchImpl(this.composeUrl(this.refreshPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Refresh token rejected')
      }

      const rawText = await response.text()
      if (!rawText) {
        throw new Error('Empty refresh response')
      }

      const envelope = JSON.parse(rawText) as ApiEnvelope<Record<string, string>>
      const data = maybeDecompress<Record<string, string>>(envelope.data, envelope.is_compress)
      const nextAccess = data?.access_token
      const nextSocket = data?.socket_token

      if (!nextAccess) {
        throw new Error('Refresh response missing access token')
      }

      this.options.sessionStorage.setSession({
        ...existing,
        accessToken: nextAccess,
        socketToken: nextSocket ?? existing.socketToken,
      })
      return true
    })()
      .catch((error) => {
        console.warn('Token refresh failed', error)
        this.handleUnauthenticated()
        return false
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  replaceTokens(nextAccessToken: string, nextRefreshToken: string, nextSocketToken?: string): void {
    const existing = this.options.sessionStorage.getSession()
    const base: Partial<SessionSnapshot> = existing ?? {}
    this.options.sessionStorage.setSession({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      socketToken: nextSocketToken ?? base.socketToken,
      user: base.user ?? null,
      identity: base.identity ?? null,
    })
  }

  private handleUnauthenticated(): void {
    this.options.sessionStorage.clear()
    this.options.onUnauthenticated?.()
  }
}


// check the back end api to understand the encription of token,
// the refresh token is set to expired in 7 days the access token in 1 hour
// one can pass as fetch for testing
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  refreshPath: '/auth/refresh_token',
  sessionStorage,
})


// access token will be received as {access_token: "some_token", }
// the access token is then store in the session with camel case accessToken
// same for refresh_token ...
