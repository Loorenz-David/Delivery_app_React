import type { ItemCategoryDetails } from '../../api/itemPropertiesService'
import { SettingsExpandableCard } from '../ui/SettingsExpandableCard'
import { ItemPropertyTag } from '../ui/ItemPropertyTag'
import type { ItemPropertyNavigatePayload } from '../section_panels/itemPropertiesTypes'

interface ItemCategoryCardProps {
  category: ItemCategoryDetails
  onEdit: (category: ItemCategoryDetails) => void
  onNavigate?: (payload: ItemPropertyNavigatePayload) => void
}

export function ItemCategoryCard({ category, onEdit, onNavigate }: ItemCategoryCardProps) {
  const types = category.item_types ?? []
  return (
    <SettingsExpandableCard
      title={
        <span className="inline-flex items-center gap-2">
          {category.name}
          <ItemPropertyTag label={`${types.length} types`} muted />
        </span>
      }
      onEdit={() => onEdit(category)}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">Types</p>
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
