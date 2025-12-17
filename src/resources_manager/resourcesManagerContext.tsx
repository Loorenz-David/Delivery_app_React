import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { ActionManager } from './managers/ActionManager'
import type { MapManager } from '../google_maps/MapManager'

interface isMobileObject {
  isMobile: boolean
  isMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  setIsMobileViewport: (isMobile: boolean) => void
}

type KnownResourceRegistry = {
  popupManager: ActionManager
  sectionManager: ActionManager
  mapManager: MapManager
  settingsPopupManager: ActionManager
  popupConfirmationManager: ActionManager
  isMobileObject: isMobileObject
}


type ResourceRegistry = Partial<KnownResourceRegistry> & Record<string, unknown>

const ResourcesManagerContext = createContext<ResourceRegistry | null>(null)

interface ResourcesManagerProviderProps {
  managers: ResourceRegistry
  children: ReactNode
}

export function ResourcesManagerProvider({ managers, children }: ResourcesManagerProviderProps) {
  return <ResourcesManagerContext.Provider value={managers}>{children}</ResourcesManagerContext.Provider>
}

function useResourcesContext() {
  const context = useContext(ResourcesManagerContext)
  if (!context) {
    throw new Error('ResourcesManagerContext is not available. Wrap your app with ResourcesManagerProvider.')
  }
  return context
}
export function useResourceManager(key: 'isMobileObject'): isMobileObject
export function useResourceManager(key: 'popupManager'): ActionManager
export function useResourceManager(key: 'sectionManager'): ActionManager
export function useResourceManager(key: 'mapManager'): MapManager
export function useResourceManager(key: 'settingsPopupManager'): ActionManager
export function useResourceManager(key: 'popupConfirmationManager'): ActionManager
export function useResourceManager<T = unknown>(key: string): T
export function useResourceManager(key: string) {
  const context = useResourcesContext()
  if (!(key in context)) {
    throw new Error(`Resource with key "${String(key)}" is not registered in ResourcesManagerContext.`)
  }
  return context[key]
}
