import type { ItemPayload } from '../types/backend'
import type { ItemStateOption } from '../api/optionServices'

export function deriveOrderStateFromItems(
  items: ItemPayload[] | undefined,
  itemStatesMap: Record<number, ItemStateOption>,
): ItemStateOption | null {
  let selectedState: ItemStateOption | null = null
  let highestPriority = -Infinity
  for (const item of items ?? []) {
    const stateId = typeof item.item_state_id === 'number' ? item.item_state_id : null
    if (stateId == null) continue
    const state = itemStatesMap[stateId]
    if (!state) continue
    const priority = typeof state.priority === 'number' ? state.priority : 0
    if (priority > highestPriority) {
      highestPriority = priority
      selectedState = state
    }
  }
  return selectedState
}
