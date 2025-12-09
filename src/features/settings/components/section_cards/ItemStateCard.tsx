import type { ItemStateDetails } from '../../api/itemPropertiesService'
import { SettingsExpandableCard } from '../ui/SettingsExpandableCard'

interface ItemStateCardProps {
  state: ItemStateDetails
  onEdit: (state: ItemStateDetails) => void
}

export function ItemStateCard({ state, onEdit }: ItemStateCardProps) {
  return (
    <SettingsExpandableCard
      prefix={<span className="h-4 w-4 rounded-full" style={{ backgroundColor: state.color }} aria-label={state.color} />}
      title={
        <>
          <span>{state.name}</span>
          {state.default ? (
            <span className="rounded-full bg-[var(--color-page)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Default
            </span>
          ) : null}
        </>
      }
      onEdit={() => onEdit(state)}
    >
      <div className="space-y-1 text-sm text-[var(--color-muted)]">
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">Description</p>
        <p className="text-[var(--color-text)]">{state.description || 'No description provided.'}</p>
      </div>
    </SettingsExpandableCard>
  )
}
