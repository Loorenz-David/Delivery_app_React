import type { ItemPositionDetails } from '../../api/itemPropertiesService'
import { SettingsExpandableCard } from '../ui/SettingsExpandableCard'

interface ItemPositionCardProps {
  position: ItemPositionDetails
  onEdit: (position: ItemPositionDetails) => void
}

export function ItemPositionCard({ position, onEdit }: ItemPositionCardProps) {
  return (
    <SettingsExpandableCard
      title={
        <span className="inline-flex items-center gap-2">
          {position.name}
          {position.default ? (
            <span className="rounded-full bg-[var(--color-page)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Default
            </span>
          ) : null}
        </span>
      }
      onEdit={() => onEdit(position)}
    >
      <div className="space-y-1 text-sm text-[var(--color-muted)]">
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">Description</p>
        <p className="text-[var(--color-text)]">{position.description || 'No description provided.'}</p>
      </div>
    </SettingsExpandableCard>
  )
}
