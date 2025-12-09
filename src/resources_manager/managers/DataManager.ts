import { useSyncExternalStore } from 'react'

type SelectionId = number | string | null

export interface ActiveSelection<TData = unknown> {
  id: SelectionId
  data: TData
  meta?: Record<string, unknown>
}

export interface DataManagerState<TDataset> {
  dataset: TDataset | null
  activeSelections: Record<string, ActiveSelection>
  isLoading: boolean
}

export interface DataFindOptions {
  selectionKey?: string
  collectionKey?: PropertyKey
  targetKey?: PropertyKey
}

type Listener = () => void

export class DataManager<TDataset extends object = object> {
  protected state: DataManagerState<TDataset>
  private listeners = new Set<Listener>()

  constructor(initialState?: Partial<DataManagerState<TDataset>>) {
    this.state = {
      dataset: null,
      activeSelections: {},
      isLoading: false,
      ...(initialState as object),
    } as DataManagerState<TDataset>
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): DataManagerState<TDataset> => {
    return this.state
  }

  protected setState(patch: Partial<DataManagerState<TDataset>>): void {
    this.state = {
      ...this.state,
      ...patch,
    }
    this.notify()
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }

  getDataset(): TDataset | null {
    return this.state.dataset
  }

  setDataset(dataset: TDataset | null): void {
    this.setState({ dataset })
  }

  updateDataset(mutator: (dataset: TDataset | null) => TDataset | null): void {
    const nextDataset = mutator(this.state.dataset)
    this.setDataset(nextDataset ?? null)
  }

  setActiveSelection(key: string, selection: ActiveSelection): void {
    this.setState({
      activeSelections: {
        ...this.state.activeSelections,
        [key]: selection,
      },
    })
  }

  removeActiveSelection(key: string): void {
    if (!(key in this.state.activeSelections)) {
      return
    }
    const nextSelections = { ...this.state.activeSelections }
    delete nextSelections[key]
    this.setState({
      activeSelections: nextSelections,
    })
  }

  clearSelections(): void {
    this.setState({
      activeSelections: {},
    })
  }

  getActiveSelection<TData = unknown>(key: string): ActiveSelection<TData> | undefined {
    return this.state.activeSelections[key] as ActiveSelection<TData> | undefined
  }

  find<TResult = unknown>(targetValue: unknown, options: DataFindOptions = {}): TResult | undefined {
    // if no selectionKey then it will use the stored dataset.
    const { selectionKey, collectionKey } = options
    // if no targetKey then it will use "id"
    let { targetKey } = options

    const source = selectionKey ? this.state.activeSelections[selectionKey]?.data : this.state.dataset

    if (source == null) {
      return undefined
    }

    // resolves the target object where the query will be executed
    const collection = this.resolveCollection(source, collectionKey)
    if (!collection) {
      return undefined
    }

    if (!targetKey) {
      targetKey = 'id'
    }

    // finds the target object
    return collection.find((item) => this.matchesTarget(item, targetValue, targetKey)) as TResult | undefined
  }

  private resolveCollection(source: unknown, collectionKey?: PropertyKey): unknown[] | undefined {
    if (source == null) {
      return undefined
    }

    if (collectionKey == null) {
      return Array.isArray(source) ? source : undefined
    }

    if (typeof source !== 'object') {
      return undefined
    }

    const container = source as Record<PropertyKey, unknown>
    const value = container[collectionKey]
    return Array.isArray(value) ? value : undefined
  }

  private matchesTarget(item: unknown, targetValue: unknown, targetKey?: PropertyKey): boolean {
    if (targetKey == null) {
      return item === targetValue
    }

    if (item == null || typeof item !== 'object') {
      return false
    }

    const record = item as Record<PropertyKey, unknown>
    return record[targetKey] === targetValue
  }

  getValue<TKey extends keyof TDataset>(
    key: TKey,
    options?: {
      selectionKey?: string
    },
  ): TDataset[TKey] | null
  getValue(key: PropertyKey, options?: { selectionKey?: string }): unknown {
    const source = options?.selectionKey
      ? this.state.activeSelections[options.selectionKey]?.data
      : this.state.dataset
    if (source == null || typeof source !== 'object') {
      return null
    }

    if (key in source) {
      return (source as Record<PropertyKey, unknown>)[key]
    }

    return null
  }

  extractChangedFields<TFields extends object>(
    original: Partial<TFields> | null | undefined,
    updated: Partial<TFields> | null | undefined,
    options?: {
      fields?: Array<keyof TFields>
    },
  ): Partial<TFields> {
    const previous = (original ?? {}) as Record<PropertyKey, unknown>
    const next = (updated ?? {}) as Record<PropertyKey, unknown>
    const keys =
      options?.fields ??
      (Array.from(new Set([...Object.keys(previous), ...Object.keys(next)])) as Array<keyof TFields>)
    const changes: Partial<TFields> = {}
    for (const key of keys) {
      const prevValue = previous[key as PropertyKey]
      const nextValue = next[key as PropertyKey]
      if (!this.areFieldValuesEqual(prevValue, nextValue)) {
        ;(changes as Record<PropertyKey, unknown>)[key as PropertyKey] = nextValue
      }
    }
    return changes
  }

  private areFieldValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true
    }
    if (a == null || b == null) {
      return a === b
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
      return false
    }
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }
}

export function useDataManager<TDataset extends object>(manager: DataManager<TDataset>) {
  return useSyncExternalStore(
    (listener) => manager.subscribe(listener),
    () => manager.getSnapshot(),
  )
}
