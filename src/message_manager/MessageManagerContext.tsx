import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { MessageStack } from './components/MessageStack'

export type MessageStatus = 'success' | 'warning' | 'error' | 'info'
export type MessageStatusInput = MessageStatus | number

export interface MessagePayload {
  status: MessageStatusInput
  message: string
  details?: string
  messageDuration?: number
}

export interface ManagedMessage extends Omit<MessagePayload, 'status'> {
  id: string
  createdAt: number
  status: MessageStatus
}

interface MessageManagerContextValue {
  showMessage: (payload: MessagePayload) => void
}

const MessageManagerContext = createContext<MessageManagerContextValue | undefined>(undefined)

const MAX_MESSAGES = 3
const MESSAGE_DURATION_MS = 5000

export function MessageManagerProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ManagedMessage[]>([])
  const timeoutsRef = useRef<Map<string, number>>(new Map())

  const clearTimer = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const removeMessage = useCallback(
    (id: string) => {
      clearTimer(id)
      setMessages((prev) => prev.filter((message) => message.id !== id))
    },
    [clearTimer],
  )

  const showMessage = useCallback(
    ({ status, message, details, messageDuration }: MessagePayload) => {
      const normalizedStatus = resolveMessageStatus(status)
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      const entry: ManagedMessage = {
        id,
        status: normalizedStatus,
        message,
        details,
        createdAt: Date.now(),
      }

      setMessages((prev) => {
        const next = [...prev, entry]
        if (next.length <= MAX_MESSAGES) {
          return next
        }

        const overflowCount = next.length - MAX_MESSAGES
        const removed = next.slice(0, overflowCount)
        removed.forEach((message) => clearTimer(message.id))
        return next.slice(overflowCount)
      })

      const timeoutId = window.setTimeout(() => removeMessage(id), messageDuration ?? MESSAGE_DURATION_MS)
      timeoutsRef.current.set(id, timeoutId)
    },
    [clearTimer, removeMessage],
  )

  const contextValue = useMemo(() => ({ showMessage }), [showMessage])

  return (
    <MessageManagerContext.Provider value={contextValue}>
      {children}
      <MessageStack messages={messages} onDismiss={removeMessage} />
    </MessageManagerContext.Provider>
  )
}

export function useMessageManager() {
  const context = useContext(MessageManagerContext)
  if (!context) {
    throw new Error('useMessageManager must be used within a MessageManagerProvider')
  }
  return context
}

function resolveMessageStatus(status: MessageStatusInput): MessageStatus {
  if (typeof status === 'number') {
    if (status >= 200 && status < 300) {
      return 'success'
    }
    if (status >= 400 && status < 500) {
      return 'warning'
    }
    if (status >= 500) {
      return 'error'
    }
    return 'info'
  }
  return status
}
