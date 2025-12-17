import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { TeamInviteSent } from '../../types'

interface SentInviteCardProps {
  invite: TeamInviteSent
  onRemove: () => void
  isBusy?: boolean
}

export function SentInviteCard({ invite, onRemove, isBusy = false }: SentInviteCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
      <div className="min-w-[220px] flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{invite.username}</p>
        <p className="text-xs text-[var(--color-muted)]">{invite.email}</p>
      </div>
      <div className="text-xs text-[var(--color-muted)]">
        {invite.date ? new Date(invite.date).toLocaleDateString() : '—'}
      </div>
      <BasicButton
        params={{
          variant: 'secondary',
          disabled: isBusy,
          onClick: onRemove,
        }}
      >
        Remove
      </BasicButton>
    </div>
  )
}
