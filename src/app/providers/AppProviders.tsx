import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../../features/auth/context/AuthContext'
import { MessageManagerProvider } from '../../message_manager/MessageManagerContext'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MessageManagerProvider>{children}</MessageManagerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
