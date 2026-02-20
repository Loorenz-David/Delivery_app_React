import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { authRegisterApi } from '@/featuresV2/auth/register/api/authRegisterApi'
import type { RegisterFields } from '@/featuresV2/auth/register/types/authRegister'
import { useAuthRegisterStore } from '@/featuresV2/auth/register/store/authRegisterStore'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

export function useRegisterMutations() {
  const { showMessage } = useMessageManager()

  const register = useCallback(
    async (payload: RegisterFields) => {
      const { setLoading, setError } = useAuthRegisterStore.getState()
      setLoading(true)
      setError(undefined)

      try {
        const response = await authRegisterApi.register(payload)
        showMessage({ status: "success", message: 'Registration successful! Please check your email to verify your account.' })

        return response
      } catch (error) {
        const resolved = resolveError(error, 'Unable to register user.')
        console.error('Failed to register user', error)
        setError(resolved.message)
        showMessage({ status: resolved.status, message: resolved.message })

        return null
      } finally {
        setLoading(false)
      }
    },
    [showMessage],
  )

  return { register }
}
