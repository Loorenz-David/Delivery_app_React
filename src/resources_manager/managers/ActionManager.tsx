import { createElement, useSyncExternalStore } from 'react'
import type { ComponentType, ReactNode } from 'react'

// Keep payload flexible; simple object shapes should be allowed without requiring an index signature.
export type ActionPayload = any

export interface BeforeCloseConfig {
  shouldWarn?: () => boolean
  onSave?: () => Promise<void>
  message?: string
  saveLabel?: string
  discardLabel?: string
}

export interface ConfirmConfig {
  message: string
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
}

export interface ActionComponentProps<TPayload = ActionPayload> {
  payload?: TPayload
  onClose: () => void
  setPopupHeader?: (content: ReactNode | null) => void
  registerBeforeClose?: (config?: BeforeCloseConfig) => void
  openConfirm?: (config: ConfirmConfig) => void
  setIsLoading:(isLoading: boolean) => void
}

export interface ActionManagerOptions {
  blueprint: ComponentType<any>
  registry: Record<string, ComponentType<any>>
  closeDelayMs?: number
}

interface ActionEntry {
  id: string
  key: string
  payload?: ActionPayload
  isClosing: boolean
  parentParams?: Record<string, unknown>
}

interface OpenMethod {
  key: string
  payload?: ActionPayload
  parentParams?: Record<string, unknown>
}

export class ActionManager {
  private entries: Array<ActionEntry> = []
  private listeners = new Set<() => void>()
  private readonly blueprint: ComponentType<any>
  private readonly registry: Record<string, ComponentType<any>>
  private readonly closeDelayMs: number

  constructor(options: ActionManagerOptions) {
    this.blueprint = options.blueprint
    this.registry = options.registry
    this.closeDelayMs = options.closeDelayMs ?? 0
  }

  open({ key, payload, parentParams }: OpenMethod) {
    const component = this.registry[key]
    
    if (!component) {
      throw new Error(`No action component registered for key: ${key}`)
    }

    const entry: ActionEntry = {
      id: crypto.randomUUID(),
      key,
      payload,
      parentParams,
      isClosing: false,
    }

    this.entries = [...this.entries, entry]
    this.notify()
  }

  close(entryId?: string) {
    if (this.entries.length === 0) {
      return
    }

    const targetIndex = entryId ? this.entries.findIndex((entry) => entry.id === entryId) : this.entries.length - 1

    if (targetIndex === -1) {
      return
    }

    if (this.closeDelayMs > 0) {
      this.entries = this.entries.map((entry, index) =>
        index >= targetIndex ? { ...entry, isClosing: true } : entry,
      )
      this.notify()
      setTimeout(() => {
        this.entries = this.entries.filter((_, index) => index < targetIndex)
        this.notify()
      }, this.closeDelayMs)
    } else {
      this.entries = this.entries.filter((_, index) => index < targetIndex)
      this.notify()
    }
  }

  closeByKey(keys: string | string[]): boolean {
    const keyList = Array.isArray(keys) ? keys : [keys]
    if (keyList.length === 0) {
      return false
    }
    const indices = this.entries
      .map((entry, idx) => (keyList.includes(entry.key) ? idx : -1))
      .filter((idx) => idx >= 0)
    if (indices.length === 0) {
      return false
    }
    const earliestIndex = Math.min(...indices)
    const targetId = this.entries[earliestIndex]?.id
    if (targetId) {
      this.close(targetId)
      return true
    }
    return false
  }

  closeAll() {
    this.entries = []
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot() {
    return this.entries
  }

  hasKey(key: string): boolean {
    return this.entries.some((entry) => entry.key === key && !entry.isClosing)
  }

  renderStack(): ReactNode[] {
    return this.entries.map((entry, index) => {
      const component = this.registry[entry.key]
      const Blueprint = this.blueprint

      return (
        <Blueprint key={entry.id} id={entry.id} position={index} params={entry.parentParams} onRequestClose={() => this.close(entry.id)}>
          {createElement(component, {
            payload: entry.payload,
            onClose: () => this.close(entry.id),
          })}
        </Blueprint>
      )
    })
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}

export function useActionEntries(manager: ActionManager) {
  return useSyncExternalStore(
    (listener) => manager.subscribe(listener),
    () => manager.getSnapshot(),
  )
}
