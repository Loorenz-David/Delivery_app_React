import { create } from 'zustand'

import type { SettingsDataset } from '../../features/settings/types'

const initialDataset: SettingsDataset = {
  UserInfo: null,
  UsersList: null,
  MessageTemplates: null,
  TeamInfo: null,
  TeamUsers: null,
  TeamSentInvites: null,
  TeamReceivedInvites: null,
  UserRoles: null,
  ItemStates: null,
  ItemPositions: null,
  ItemTypes: null,
  ItemCategories: null,
  ItemSubProperties: null,
}

const buildInitialDataset = (): SettingsDataset => ({ ...initialDataset })

type SettingsState = {
  dataset: SettingsDataset
  setDataset: (dataset: SettingsDataset) => void
  updateDataset: (updater: (prev: SettingsDataset) => SettingsDataset) => void
  resetDataset: () => void
  upsertIntoCollection: <T extends { id: number }>(key: keyof SettingsDataset | string, entity: T) => void
  removeFromCollection: (key: keyof SettingsDataset | string, id: number) => void
}

export type SettingsDatasetUpdater = SettingsState['updateDataset']

export const useSettingsStore = create<SettingsState>((set) => ({
  dataset: buildInitialDataset(),
  setDataset: (dataset) => set({ dataset: dataset ?? buildInitialDataset() }),
  updateDataset: (updater) =>
    set((state) => ({
      dataset: updater(state.dataset ?? buildInitialDataset()) ?? buildInitialDataset(),
    })),
  resetDataset: () => set({ dataset: buildInitialDataset() }),
  upsertIntoCollection: <T extends { id: number }>(key: keyof SettingsDataset, entity: T) => {
    set((state) => {
      const current = state.dataset ?? initialDataset
      const next = { ...current } as Record<string, unknown>
      const collection = Array.isArray(next[key as string]) ? ([...(next[key as string] as unknown[])] as T[]) : []
      const index = collection.findIndex((item) => (item as { id: number }).id === entity.id)
      if (index >= 0) {
        collection[index] = entity
      } else {
        collection.push(entity)
      }
      next[key as string] = collection
      return { dataset: next as SettingsDataset }
    })
  },
  removeFromCollection: (key, id) => {
    set((state) => {
      const current = state.dataset ?? initialDataset
      const next = { ...current } as Record<string, unknown>
      const collection = Array.isArray(next[key as string]) ? ([...(next[key as string] as unknown[])] as Array<{ id: number }>) : null
      if (!collection) {
        return {}
      }
      next[key as string] = collection.filter((item) => item.id !== id)
      return { dataset: next as SettingsDataset }
    })
  },
}))

export const settingsStore = useSettingsStore
