import { useCallback, useEffect, useMemo } from 'react'

import { FillUserAccount, type FillUserAccountPayload } from '../popup_fills/FillUserAccount'
import type { SettingsUserProfile } from '../../types'
import { AccountSettingsService } from '../../api/accountService'
import { normalizeUserPayload } from '../../utils/userTransformers'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { apiClient } from '../../../../lib/api/ApiClient'
import { useSettingsStore } from '../../../../store/settings/useSettingsStore'

type AccountPanelMode = 'self' | 'manage' | 'create'

interface AccountSectionPanelProps {
  mode?: AccountPanelMode
  initialUser?: SettingsUserProfile | null
}

export function AccountSectionPanel({ mode = 'self', initialUser }: AccountSectionPanelProps) {
  const dataset = useSettingsStore((state) => state.dataset)
  const updateDataset = useSettingsStore((state) => state.updateDataset)
  const cachedUser = dataset?.UserInfo ?? null
  const accountService = useMemo(() => new AccountSettingsService(), [])
  const { showMessage } = useMessageManager()
  const sessionUserId = useMemo(() => apiClient.getSessionUserId(), [])

  const targetUser = useMemo(() => {
    if (mode === 'self') {
      return cachedUser ?? null
    }
    if (mode === 'manage') {
      return initialUser ?? null
    }
    return null
  }, [cachedUser, initialUser, mode])

  const payload = useMemo<FillUserAccountPayload>(
    () => ({
      mode,
      user: targetUser,
    }),
    [mode, targetUser],
  )

  const handleClose = useCallback(() => undefined, [])

  useEffect(() => {
    if (mode !== 'self' || targetUser || !sessionUserId) {
      return
    }
    let isMounted = true
    const fetchUser = async () => {
      try {
        const response = await accountService.fetchUserById(sessionUserId)
        if (!isMounted) {
          return
        }
        const record = response.data?.items?.[0]
        if (!record) {
          return
        }
        const normalized = normalizeUserPayload(record)
        updateDataset((prev) => ({
          ...(prev ?? { UserInfo: null, UsersList: null, MessageTemplates: null }),
          UserInfo: normalized,
        }))
      } catch (error) {
        if (isMounted) {
          showMessage({ status: 500, message: 'Failed to load account information.' })
          console.error('Failed to fetch user info', error)
        }
      }
    }
    fetchUser()
    return () => {
      isMounted = false
    }
  }, [accountService, mode, sessionUserId, showMessage, targetUser, updateDataset])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {mode === 'self' ? 'Account' : mode === 'create' ? 'New User' : 'Manage user'}
        </p>
        <p className="text-2xl font-bold text-[var(--color-text)]">
          {mode === 'create' ? 'Create new user' : mode === 'manage' ? 'Edit user' : 'Make it yours'}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {mode === 'self'
            ? 'Update your profile photo, contact information, and security preferences.'
            : mode === 'create'
            ? 'Fill in the details below to invite a new teammate.'
            : 'Update user details and roles to keep your directory accurate.'}
        </p>
      </div>

      <FillUserAccount payload={payload} onClose={handleClose} />
    </div>
  )
}
