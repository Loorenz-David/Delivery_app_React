import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { SettingsSearchBar } from '../ui/SearchBar'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import type { DataManager } from '../../../../resources_manager/managers/DataManager'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'
import type { SettingsDataset } from '../../types'

type ResponseWithItems<TItem> = {
  data?: {
    items?: TItem[]
  }
}

type FilterOption = {
  value: string
  label: string
}

interface SectionPanelServices<TResponse, TQuery extends Record<string, unknown>> {
  queryAllService: () => Promise<ResponseWithItems<TResponse>>
  queryByInputService: (queryFilters: TQuery) => Promise<ResponseWithItems<TResponse>>
}

interface SectionPanelProps<
  TItem,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
  TResponse = TItem,
> {
  eyebrow?: string
  title: string
  description?: string
  onCreate: () => void
  createButtonLabel: string
  dataManagerKey: string
  renderObjectCard: (item: TItem) => ReactNode
  services: SectionPanelServices<TResponse, TQuery>
  normalize?: (item: TResponse) => TItem
  searchFilterOptions?: FilterOption[]
  searchPlaceholder?: string
  searchBuildQuery?: (value: string, filter: string) => TQuery | null
  defaultSearchFilter?: string
  emptyStateMessage?: string
  loadingStateMessage?: string
  counterLabel?: (count: number) => string
  getItemKey?: (item: TItem, index: number) => string | number
  listClassName?: string
  searchBarClassName?: string
  searchInjection?: {
    id?: string | number
    value: string
    filter?: string
  } | null
}

export function SectionPanel<
  TItem,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
  TResponse = TItem,
>({
  eyebrow,
  title,
  description,
  onCreate,
  createButtonLabel,
  dataManagerKey,
  renderObjectCard,
  services,
  normalize,
  searchFilterOptions,
  searchPlaceholder = 'Search…',
  searchBuildQuery,
  defaultSearchFilter,
  emptyStateMessage = 'No items found.',
  loadingStateMessage = 'Loading items...',
  counterLabel,
  getItemKey,
  listClassName = 'flex flex-col gap-3',
  searchBarClassName,
  searchInjection,
}: SectionPanelProps<TItem, TQuery, TResponse>) {
  const settingsDataManager = useResourceManager<DataManager<SettingsDataset>>('settingsDataManager')
  const snapshot = useDataManager(settingsDataManager)
  const { showMessage } = useMessageManager()
  const { queryAllService, queryByInputService } = services
  const datasetRecord = snapshot.dataset as Record<string, unknown> | null
  const cachedItems = useMemo(
    () => (datasetRecord?.[dataManagerKey] as TItem[] | null | undefined) ?? null,
    [dataManagerKey, datasetRecord],
  )
  const [items, setItems] = useState<TItem[]>(cachedItems ?? [])
  const [isLoading, setIsLoading] = useState(false)

  const applyNormalization = useCallback((payload: TResponse) => {
    return normalize ? normalize(payload) : (payload as unknown as TItem)
  }, [normalize])

  const normalizeItems = useCallback(
    (payload: TResponse[] | undefined) => {
      return (payload ?? []).map((item) => applyNormalization(item))
    },
    [applyNormalization],
  )

  const refreshItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await queryAllService()
      const normalized = normalizeItems(response.data?.items ?? undefined)
      setItems(normalized)
      settingsDataManager.updateDataset((prev) => {
        const next = { ...(prev ?? {}) } as SettingsDataset
        next[dataManagerKey] = normalized
        return next
      })
    } catch (error) {
      console.error('Failed to refresh section data', error)
      showMessage({ status: 500, message: 'Failed to load data.' })
    } finally {
      setIsLoading(false)
    }
  }, [dataManagerKey, normalizeItems, queryAllService, settingsDataManager, showMessage])

  useEffect(() => {
    if (cachedItems && cachedItems.length > 0) {
      setItems(cachedItems)
      return
    }
    refreshItems()
  }, [cachedItems, refreshItems])

  const handleSearchReset = useCallback(() => {
    setItems(cachedItems ?? [])
  }, [cachedItems])

  const handleSearchResults = useCallback((results: TItem[]) => {
    setItems(results)
  }, [])

  const searchService = useCallback(
    async (queryFilters: TQuery) => {
      const response = await queryByInputService(queryFilters)
      return normalizeItems(response.data?.items ?? undefined)
    },
    [normalizeItems, queryByInputService],
  )

  const filterOptions = useMemo(() => searchFilterOptions ?? [], [searchFilterOptions])

  const counterValue = useMemo(() => {
    if (counterLabel) {
      return counterLabel(items.length)
    }
    return `${items.length} items found.`
  }, [counterLabel, items.length])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">{eyebrow}</p>
        ) : null}
        <div>
          <p className="text-2xl font-semibold text-[var(--color-text)]">{title}</p>
          {description ? <p className="text-sm text-[var(--color-muted)]">{description}</p> : null}
        </div>
      </div>

      <SettingsSearchBar
        filterOptions={filterOptions}
        service={searchService}
        onResults={handleSearchResults}
        onReset={handleSearchReset}
        placeholder={searchPlaceholder}
        buildQuery={searchBuildQuery}
        defaultFilter={defaultSearchFilter}
        className={searchBarClassName}
        injectedSearch={searchInjection ?? undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4">
        <BasicButton
          params={{
            variant: 'primary',
            onClick: onCreate,
          }}
        >
          {createButtonLabel}
        </BasicButton>
        <p className="text-sm text-[var(--color-muted)]">{counterValue}</p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white/50 p-6 text-sm text-[var(--color-muted)]">
          {loadingStateMessage}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white/50 p-6 text-sm text-[var(--color-muted)]">
          {emptyStateMessage}
        </div>
      ) : (
        <div className={listClassName}>
          {items.map((item, index) => {
            const keyCandidate = getItemKey?.(item, index)
            const mappedKey =
              typeof keyCandidate === 'string' || typeof keyCandidate === 'number' ? keyCandidate : index
            return <div key={mappedKey}>{renderObjectCard(item)}</div>
          })}
        </div>
      )}
    </div>
  )
}
