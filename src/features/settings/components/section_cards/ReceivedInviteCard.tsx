import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { TeamInviteReceived } from '../../types'

interface ReceivedInviteCardProps {
  invite: TeamInviteReceived
  onAccept: () => void
  onReject: () => void
  isBusy?: boolean
}

export function ReceivedInviteCard({ invite, onAccept, onReject, isBusy = false }: ReceivedInviteCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
      <div className="min-w-[220px] flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{invite.team_name}</p>
        <p className="text-xs text-[var(--color-muted)]">
          {invite.date ? new Date(invite.date).toLocaleDateString() : 'Pending'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <BasicButton
          params={{
            variant: 'secondary',
            disabled: isBusy,
            onClick: onReject,
          }}
        >
          Reject
        </BasicButton>
        <BasicButton
          params={{
            variant: 'primary',
            disabled: isBusy,
            onClick: onAccept,
          }}
        >
          Accept
        </BasicButton>
      </div>
    </div>
  )
}
