import { useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { AuthCard } from '../components/AuthCard'
import type { AuthMode } from '../components/AuthForm'

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const mode: AuthMode = useMemo(() => {
    if (location.pathname.endsWith('/register')) {
      return 'register'
    }

    return 'login'
  }, [location.pathname])

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode) {
      return
    }
    navigate(nextMode === 'login' ? '/auth/login' : '/auth/register')
  }

  if (location.pathname === '/auth') {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-[var(--color-page)] lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-[var(--color-surface)] p-12 lg:flex">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Beyo Delivery</p>
          <h1 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">
            Operational clarity for every delivery team.
          </h1>
          <p className="mt-4 max-w-md text-base text-[var(--color-muted)]">
            Coordinate dispatchers, drivers, and customers from a single responsive control tower.
          </p>
        </div>

        <div className="space-y-4 text-sm text-[var(--color-muted)]">
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-text)]">Performance ready</p>
            <p className="mt-2">
              Drag-and-drop manifests, live route insights, and real-time notifications designed for speed.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-text)]">API driven</p>
            <p className="mt-2">Connect directly to the Flask backend via secure, compressed calls.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <AuthCard mode={mode} onModeChange={handleModeChange} />
      </section>
    </div>
  )
}

