import type { ItemTypeDetails } from '../../api/itemPropertiesService'
import { SettingsExpandableCard } from '../ui/SettingsExpandableCard'
import { ItemPropertyTag } from '../ui/ItemPropertyTag'
import type { ItemPropertyNavigatePayload } from '../section_panels/itemPropertiesTypes'

interface ItemTypeCardProps {
  itemType: ItemTypeDetails
  onEdit: (type: ItemTypeDetails) => void
  onNavigate?: (payload: ItemPropertyNavigatePayload) => void
}

export function ItemTypeCard({ itemType, onEdit, onNavigate }: ItemTypeCardProps) {
  const categoryName = itemType.item_category?.name
  return (
    <SettingsExpandableCard
      title={
        <span className="inline-flex items-center gap-2">
          {itemType.name}
          {categoryName ? (
            <ItemPropertyTag
              label={categoryName}
              onClick={() =>
                onNavigate?.({
                  tab: 'categories',
                  filter: 'name',
                  value: categoryName,
                })
              }
            />
          ) : null}
        </span>
      }
      onEdit={() => onEdit(itemType)}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">Properties</p>
        {itemType.properties && itemType.properties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {itemType.properties.map((property) => (
              <ItemPropertyTag
                key={property.id}
                label={property.name}
                onClick={() =>
                  onNavigate?.({
                    tab: 'sub-properties',
                    filter: 'name',
                    value: property.name,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No properties linked yet.</p>
        )}
      </div>
    </SettingsExpandableCard>
  )
}
