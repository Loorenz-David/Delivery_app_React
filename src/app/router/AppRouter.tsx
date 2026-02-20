import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'

import { AuthPage } from '@/featuresV2/auth/pages/AuthPage'
import { Home } from '../../featuresV2/home/pages/HomePage'
import { SettingsPage } from '@/featuresV2/settings/pages/SettingsPage'

import { useAuthSession } from '../../featuresV2/auth/login/hooks/useAuthSelectors'
import { ExternalCustomerFormPage } from '@/featuresV2/externalForm/pages/ExternalCustomerForm.page'

function ProtectedRoute({ children }: { children: ReactElement }) {
  const session = useAuthSession()
  const isAuthenticated = Boolean(session)
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
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/*" element={<AuthPage />} />
     
      
      <Route 
        path="/settings/*"
        element={
          <ProtectedRoute>
            <SettingsPage/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/external-form/*"
        element={
          <ProtectedRoute>
            <ExternalCustomerFormPage/>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    
  )
}
