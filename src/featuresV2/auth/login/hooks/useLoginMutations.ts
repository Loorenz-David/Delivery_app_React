import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { authLoginApi } from '@/featuresV2/auth/login/api/authLoginApi'
import type { LoginPayload } from '@/featuresV2/auth/login/types/authLogin'
import { useAuthSessionStore } from '@/featuresV2/auth/login/store/authSessionStore'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

export function useLoginMutations() {
  const { showMessage } = useMessageManager()

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { setLoading, setError, setSession } = useAuthSessionStore.getState()
      setLoading(true)
      setError(undefined)

      try {
        const response = await authLoginApi.login(payload)
        const data = response.data

        if (!data?.access_token || !data?.refresh_token) {
          console.warn('Login response missing tokens', data)
          setError('Login response missing tokens.')
          return null
        }

        setSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          socketToken: data.socket_token,
          user: data.user ?? null,
          identity: null,
        })

        return data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to login.')
        console.error('Failed to login', error)
        setError(resolved.message)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showMessage],
  )

  const logout = useCallback(() => {
    const { clearSession, setError } = useAuthSessionStore.getState()
    setError(undefined)
    clearSession()
  }, [])

  return { login, logout }
}
