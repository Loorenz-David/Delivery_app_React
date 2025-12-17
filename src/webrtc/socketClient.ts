import { io, type Socket } from 'socket.io-client'

import { apiClient } from '../lib/api/ApiClient'

type SocketFactoryOptions = {
  /**
   * Optional override for the socket server URL. If not provided, it derives
   * from VITE_SOCKET_URL or falls back to VITE_API_BASE_URL.
   */
  url?: string
}

const deriveSocketUrl = (): string => {
  // Prefer an explicit socket URL if provided via env.
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined
  if (explicit) {
    return explicit
  }

  // Fall back to the API origin (strip any path like "/api") and swap http->ws.
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000'
  try {
    const url = new URL(apiBase)
    return `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`
  } catch {
    // If parsing fails, fallback to simple replace.
    return apiBase.startsWith('http') ? apiBase.replace(/^http/, 'ws') : apiBase
  }
}

export const createAuthorizedSocket = (options?: SocketFactoryOptions): Socket => {
  const url = options?.url ?? deriveSocketUrl()
  const token = apiClient.getSocketToken() || apiClient.getAccessToken()

  // socket.io server expects the token either in the Authorization header or query param.
  const extraHeaders = token ? { Authorization: `Bearer ${token}` } : undefined
  return io(url, {
    // Allow polling fallback so we can still connect when WebSocket is unavailable
    transports: ['polling','websocket'],
    autoConnect: false, // the caller decides when to connect (after tokens are present)
    withCredentials: true,
    extraHeaders,
    path: '/socket.io',
  })
}
