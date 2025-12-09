import type { ItemPropertyPayload } from '../../api/itemPropertiesService'
import { SettingsExpandableCard } from '../ui/SettingsExpandableCard'
import { ItemPropertyTag } from '../ui/ItemPropertyTag'
import type { ItemPropertyNavigatePayload } from '../section_panels/itemPropertiesTypes'

interface ItemPropertyCardProps {
  property: ItemPropertyPayload
  onEdit: (property: ItemPropertyPayload) => void
  onNavigate?: (payload: ItemPropertyNavigatePayload) => void
}

export function ItemPropertyCard({ property, onEdit, onNavigate }: ItemPropertyCardProps) {
  const types = property.item_types ?? []
  return (
    <SettingsExpandableCard
      title={
        <span className="inline-flex items-center gap-2">
          {property.name}
          <ItemPropertyTag label={`${types.length} types`} muted />
        </span>
      }
      onEdit={() => onEdit(property)}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">Field type</p>
          <p className="text-sm text-[var(--color-text)]">{property.field_type}</p>
        </div>
        {types.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <ItemPropertyTag
                key={type.id}
                label={type.name}
                onClick={() =>
                  onNavigate?.({
                    tab: 'types',
                    filter: 'name',
                    value: type.name,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No types associated yet.</p>
        )}
      </div>
    </SettingsExpandableCard>
  )
}
