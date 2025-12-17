import { useState } from 'react'

import { ChevronDownIcon } from '../../../../assets/icons'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DropDown } from '../../../../components/buttons/DropDown'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'
import type { SettingsUserProfile, SettingsUserRole } from '../../types'

interface TeamUserCardProps {
  user: SettingsUserProfile
  roles: SettingsUserRole[]
  onRoleChange: (roleId: number | null) => void
  onKick: () => void
  isBusy?: boolean
}

export function TeamUserCard({ user, roles, onRoleChange, onKick, isBusy = false }: TeamUserCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentRoleId = user.rawRole?.id ?? null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ProfilePicture src={user.profilePicture} initials={getInitials(user.username)} size={48} />
        <div className="flex-1 min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-text)]">{user.username}</p>
          <p className="truncate text-sm text-[var(--color-muted)]">{user.rawRole?.role ?? '—'}</p>
        </div>
        <span className={`text-[var(--color-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon className="app-icon h-4 w-4" />
        </span>
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-muted)]" htmlFor={`role-${user.id}`}>
              Role
            </label>
            <div className="min-w-[180px]">
              <DropDown
                options={[
                  { value: '', display: 'Select role' },
                  ...roles.map((role) => ({ value: role.id, display: role.role })),
                ]}
                state={[
                  currentRoleId ?? '',
                  (next) => {
                    const value = next === '' ? null : Number(next)
                    onRoleChange(Number.isNaN(value as number) ? null : value)
                  },
                ]}
                buttonClassName="gap-2 items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)]">Email</p>
              <p className="text-sm text-[var(--color-text)] break-words">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)]">Phone</p>
              <p className="text-sm text-[var(--color-text)]">
                {user.phone ? `${user.phone.prefix} ${user.phone.number}` : '—'}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <BasicButton
              params={{
                variant: 'secondary',
                disabled: isBusy,
                onClick: onKick,
              }}
            >
              Kick
            </BasicButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getInitials(username: string) {
  return username
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
