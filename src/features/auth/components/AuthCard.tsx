import { Button } from '../../../components/ui/Button'
import { SurfaceCard } from '../../../components/ui/SurfaceCard'
import { cn } from '../../../lib/utils/cn'
import { AuthForm, type AuthMode } from './AuthForm'

interface AuthCardProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
}

const tabs: Array<{ key: AuthMode; label: string; description: string }> = [
  { key: 'login', label: 'Login', description: 'Access your workspace' },
  { key: 'register', label: 'Register', description: 'Bootstrap a new team' },
]

export function AuthCard({ mode, onModeChange }: AuthCardProps) {
  return (
    <SurfaceCard className="space-y-6">
      <div className="flex w-full rounded-2xl bg-[var(--color-accent)] p-1">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            aria-label={tab.description}
            className={cn(
              'flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition',
              mode === tab.key
                ? 'bg-white text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-muted)]">
          {mode === 'login'
            ? 'Authenticate with your existing  credentials.'
            : 'Create a workspace to coordinate teams, routes, and drivers.'}
        </p>
      </div>

      <AuthForm mode={mode} />

      <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          <p>Reliable JWT-based authentication keeps your deliveries secure.</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          <p>Payload compression is handled automatically to keep responses lean.</p>
        </div>
        <Button
          variant="ghost"
          className="justify-start px-0 text-[var(--color-primary)] hover:text-[var(--color-primary)]"
          onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register your team.' : 'Already registered? Log in instead.'}
        </Button>
      </div>
    </SurfaceCard>
  )
}
