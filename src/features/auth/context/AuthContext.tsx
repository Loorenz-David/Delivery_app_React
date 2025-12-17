import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { apiClient } from '../../../lib/api/ApiClient'
import type { SessionSnapshot, SessionUser } from '../../../lib/storage/sessionStorage'
import { sessionStorage } from '../../../lib/storage/sessionStorage'
import { authService } from '../api/authService'
import type { LoginPayload } from '../types'
import { realtimeSocketManager } from '../../../webrtc'

interface AuthContextValue {
  session: SessionSnapshot | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionSnapshot | null>(() => sessionStorage.getSession())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = sessionStorage.subscribe((nextSession) => {
      setSession(nextSession)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    // sets up what the session clean up when unauthenticated
    apiClient.setUnauthenticatedHandler(() => {
      setSession(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    })
  }, [])

  useEffect(() => {
    // Keep the socket connection aligned with auth state (handles refresh/page reload).
    if (session?.accessToken) {
      realtimeSocketManager.connect()
    } else {
      realtimeSocketManager.disconnect()
    }
  }, [session?.accessToken])

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true)
    try {
      const data = await authService.login(payload)
      

      const user: SessionUser = {
        id: data.user.id,
        email: data.user.email,
        
      }

      sessionStorage.setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        socketToken: data.socket_token,
        user,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    realtimeSocketManager.disconnect()
    sessionStorage.clear()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      logout,
      isLoading,
    }),
    [session, login, logout, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
