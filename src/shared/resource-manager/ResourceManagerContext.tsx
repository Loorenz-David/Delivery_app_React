import { createContext } from 'react'
import type { ReactNode } from 'react'

import { usePayloadBaseControlls } from '@/featuresV2/home/hooks/useBaseControlls'

import type { StackActionManager } from '../stack-manager/StackActionManager'


import type { MapBridge } from '@/shared/map'

export interface isMobileObject {
  isMobile: boolean
  isMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  setIsMobileViewport: (isMobile: boolean) => void
}

export type KnownResourceRegistry = {
  popupManager?: StackActionManager<Record<string, unknown>>
  sectionManager?: StackActionManager<Record<string, unknown>>
  mapManager?: MapBridge
  settingsPopupManager?: StackActionManager<Record<string, unknown>>
  popupConfirmationManager?: StackActionManager<Record<string, unknown>>
  isMobileObject?: isMobileObject
  baseControlls?: ReturnType<typeof usePayloadBaseControlls>
  droppedInPlan?: string | null
}

export type ResourceRegistry<T extends Record<string, unknown> = KnownResourceRegistry> =
  Partial<T> & Record<string, unknown>

export const ResourcesManagerContext = createContext<ResourceRegistry | null>(null)

interface ResourcesManagerProviderProps<T extends Record<string, unknown> = KnownResourceRegistry> {
  managers: ResourceRegistry<T>
  children: ReactNode
}

export function ResourcesManagerProvider<T extends Record<string, unknown> = KnownResourceRegistry>({
  managers,
  children,
}: ResourcesManagerProviderProps<T>) {
  return <ResourcesManagerContext.Provider value={managers}>{children}</ResourcesManagerContext.Provider>
}
