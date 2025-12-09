import { useCallback, useState } from 'react'

import type { InputWarningState } from './InputWarning'

export interface InputWarningController {
  warning: InputWarningState
  showWarning: (message?: string) => void
  hideWarning: () => void
  setWarningMessage: (message?: string) => void
}

export function useInputWarning(initialMessage?: string): InputWarningController {
  const [warning, setWarning] = useState<InputWarningState>({
    message: initialMessage,
    isVisible: false,
  })

  const showWarning = useCallback(
    (message?: string) => {
      setWarning((prev) => ({
        message: message ?? prev.message ?? initialMessage,
        isVisible: true,
      }))
    },
    [initialMessage],
  )

  const hideWarning = useCallback(() => {
    setWarning((prev) => ({
      ...prev,
      isVisible: false,
    }))
  }, [])

  const setWarningMessage = useCallback((message?: string) => {
    setWarning((prev) => ({
      ...prev,
      message,
    }))
  }, [])

  return {
    warning,
    showWarning,
    hideWarning,
    setWarningMessage,
  }
}
