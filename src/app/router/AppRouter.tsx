import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'

import { AuthPage } from '../../features/auth/pages/AuthPage'
import { HomePage } from '../../features/home/pages/HomePage'
import { SettingsPage } from '../../features/settings/pages/SettingsPage'
import { useAuth } from '../../features/auth/context/AuthContext'

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  return children
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/*" element={<AuthPage />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
