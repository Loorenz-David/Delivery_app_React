import { useState } from 'react'

import { ChevronDownIcon } from '../../../../assets/icons'

import type { SettingsUserProfile } from '../../types'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'

interface UserCardProps {
  user: SettingsUserProfile
  onEdit: (user: SettingsUserProfile) => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const initials = getInitials(user.username)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsExpanded((prev) => !prev)
          }
        }}
      >
        <ProfilePicture src={user.profilePicture} initials={initials} size={56} />
        <div className="flex-1">
          <p className="text-base font-semibold text-[var(--color-text)]">{user.username}</p>
          <p className="text-sm text-[var(--color-muted)]">{user.role}</p>
        </div>
       
        <BasicButton
          params={{
            variant: 'secondary',
            className: 'text-xs font-semibold uppercase tracking-[0.2em]',
            onClick: () => {
             
              onEdit(user)
            },
          }}
        >
          Edit
        </BasicButton>
        <span className={`text-[var(--color-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon className="app-icon h-4 w-4" />
        </span>
      </div>
      {isExpanded ? (
        <div className="flex mt-4 justify-around text-sm text-[var(--color-text)]">
          <div className="flex flex-col gap-1">
            <p className="text-xs">Email: </p>
            <span className="font-medium pl-1">{user.email}</span>
          </div>
           <div className="flex flex-col gap-1">
            <p className="text-xs" >Phone: </p>
            {user.phone ? 
              <span className="font-medium pl-1">{user.phone.prefix} {user.phone.number}</span>
              :
               <span className="font-medium pl-1">undefined</span>
            }
            
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
