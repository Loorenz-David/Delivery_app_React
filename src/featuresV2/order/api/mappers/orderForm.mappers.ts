import type { Item } from '@/featuresV2/order/item'

export const mapItemsFromTable = (table: { byClientId: Record<string, Item>; allIds: string[] }): Item[] =>
  table.allIds
    .map((clientId) => table.byClientId[clientId])
    .filter((item): item is Item => Boolean(item))
