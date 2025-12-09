export type ItemPropertiesTabKey = 'states' | 'positions' | 'types' | 'categories' | 'sub-properties'

export interface ItemPropertyNavigatePayload {
  tab: ItemPropertiesTabKey
  filter: string
  value: string
}
