import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { ApiError } from '../../../lib/api/ApiClient'
import { useMessageManager } from '../../../message_manager/MessageManagerContext'
import { useAuth } from '../context/AuthContext'
import { authService } from '../api/authService'
import type { LoginPayload, RegisterPayload } from '../types'

export type AuthMode = 'login' | 'register'

interface AuthFormProps {
  mode: AuthMode
}

const DEFAULT_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  teamName: '',
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formState, setFormState] = useState(DEFAULT_FORM)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showMessage } = useMessageManager()

  useEffect(() => {
    setFeedback(null)
    setFormState({ ...DEFAULT_FORM })
  }, [mode])

  const passwordMismatch =
    mode === 'register' &&
    formState.confirmPassword !== '' &&
    formState.password !== formState.confirmPassword

  useEffect(() => {
    if (mode !== 'register') return

    if (passwordMismatch) {
      setFeedback((prev) =>
        prev?.message === 'Passwords do not match.' ? prev : { type: 'error', message: 'Passwords do not match.' },
      )
      return
    }

    setFeedback((prev) => (prev?.message === 'Passwords do not match.' ? null : prev))
  }, [mode, passwordMismatch])

  const buttonLabel = mode === 'login' ? 'Access dashboard' : 'Create account'
  const helperLabel =
    mode === 'login'
      ? 'Use your work credentials to get access to your deliveries.'
      : 'Set your credentials to bootstrap your workspace.'

  const handleChange = (field: keyof typeof DEFAULT_FORM) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const isDisabled = useMemo(() => {
    if (!formState.email || !formState.password) {
      return true
    }

    if (mode === 'register' && (!formState.name || !formState.confirmPassword)) {
      return true
    }

    if (passwordMismatch) {
      return true
    }

    return false
  }, [formState, mode, passwordMismatch])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (mode === 'register' && passwordMismatch) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setFeedback(null)

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const payload: LoginPayload = {
          email: formState.email.trim(),
          password: formState.password,
        }

        await login(payload)
        setFeedback({ type: 'success', message: 'Authenticated successfully. Redirecting…' })
        navigate('/')
      } else {
        const payload: RegisterPayload = {
          email: formState.email.trim(),
          password: formState.password,
          name: formState.name.trim(),
        }

        await authService.register(payload)
        showMessage({ status: 'success', message: 'Registration Successful. You can now sign in.' })
        navigate('/auth/login')
      }
    } catch (error) {
      
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong while processing your request. Try again.'
        
      setFeedback({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold capitalize text-[var(--color-text)]">{mode} to Beyo Delivery</h2>
        <p className="text-sm text-[var(--color-muted)]">{helperLabel}</p>
      </div>

      <div className="space-y-4">
        {mode === 'register' && (
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            value={formState.name}
            onChange={handleChange('name')}
            placeholder="Lina Martínez"
          />
        )}

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={formState.email}
          onChange={handleChange('email')}
          placeholder="team@company.com"
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={formState.password}
          onChange={handleChange('password')}
          placeholder="••••••••"
        />

        {mode === 'register' && (
          <TextField
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={formState.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="••••••••"
          />
        )}

      </div>

      {feedback && (
        <p
          className={feedback.type === 'error' ? 'text-sm text-red-500' : 'text-sm text-green-600'}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={isDisabled} isLoading={isSubmitting}>
        {buttonLabel}
      </Button>
    </form>
  )
}
