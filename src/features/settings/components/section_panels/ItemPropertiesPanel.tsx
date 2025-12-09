import { useMemo, useState, type ComponentType, type SVGProps } from 'react'

import { GridIcon, LabelIcon, LayersIcon, LocationIcon, SliderIcon } from '../../../../assets/icons'

import {
  ItemPropertiesService,
  type ItemCategoryDetails,
  type ItemPositionDetails,
  type ItemPropertyPayload,
  type ItemStateDetails,
  type ItemTypeDetails,
} from '../../api/itemPropertiesService'
import { SectionPanel } from './SectionPanel'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import type { ItemPropertyNavigatePayload, ItemPropertiesTabKey } from './itemPropertiesTypes'
import { ItemStateCard } from '../section_cards/ItemStateCard'
import { ItemPositionCard } from '../section_cards/ItemPositionCard'
import { ItemTypeCard } from '../section_cards/ItemTypeCard'
import { ItemCategoryCard } from '../section_cards/ItemCategoryCard'
import { ItemPropertyCard } from '../section_cards/ItemPropertyCard'

type ItemPropertiesTab = {
  key: ItemPropertiesTabKey
  label: string
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const TAB_OPTIONS: ItemPropertiesTab[] = [
  {
    key: 'states',
    label: 'Item States',
    title: 'Track fulfillment progress',
    description: 'Define the checkpoints an item moves through so dispatchers can anticipate the next action.',
    icon: LayersIcon,
  },
  {
    key: 'positions',
    label: 'Item Positions',
    title: 'Map real-world placement',
    description: 'Describe where products sit in a warehouse or vehicle to simplify picking and loading.',
    icon: LocationIcon,
  },
  {
    key: 'types',
    label: 'Item Types',
    title: 'Standardize item definitions',
    description: 'Create reusable templates that capture handling rules, storage needs, or size constraints.',
    icon: GridIcon,
  },
  {
    key: 'categories',
    label: 'Item Categories',
    title: 'Group inventory logically',
    description: 'Bundle similar SKUs to drive reporting, permissions, and automations across the platform.',
    icon: LabelIcon,
  },
  {
    key: 'sub-properties',
    label: 'Item Sub Properties',
    title: 'Extend data points',
    description: 'Add optional metadata fields like temperature ranges or assembly instructions per item.',
    icon: SliderIcon,
  },
]

const DEFAULT_TAB: ItemPropertiesTabKey = 'states'
const DEFAULT_SEARCH_FILTER = 'name'

type QueryFilters = Record<string, unknown>

const TAB_MAP = TAB_OPTIONS.reduce<Record<ItemPropertiesTabKey, ItemPropertiesTab>>((acc, tab) => {
  acc[tab.key] = tab
  return acc
}, {} as Record<ItemPropertiesTabKey, ItemPropertiesTab>)

const PANEL_NOUNS: Record<ItemPropertiesTabKey, string> = {
  states: 'state',
  positions: 'position',
  types: 'type',
  categories: 'category',
  'sub-properties': 'sub-property',
}

const DATASET_KEYS: Record<ItemPropertiesTabKey, string> = {
  states: 'ItemStates',
  positions: 'ItemPositions',
  types: 'ItemTypes',
  categories: 'ItemCategories',
  'sub-properties': 'ItemSubProperties',
}

const POPUP_KEYS: Record<ItemPropertiesTabKey, string> = {
  states: 'FillItemState',
  positions: 'FillItemPosition',
  types: 'FillItemType',
  categories: 'FillItemCategory',
  'sub-properties': 'FillItemProperty',
}

const TYPE_FILTER_OPTIONS = [
  { value: 'name', label: 'Type name' },
  { value: 'item_category.name', label: 'Category' },
]

const CATEGORY_FILTER_OPTIONS = [
  { value: 'name', label: 'Category name' },
  { value: 'item_types.name', label: 'Attached type' },
]

const PROPERTY_FILTER_OPTIONS = [
  { value: 'name', label: 'Property name' },
  { value: 'field_type', label: 'Field type' },
  { value: 'item_types.name', label: 'Linked type' },
]

const buildItemTypeSearchQuery = (value: string, filter: string): QueryFilters => ({
  [filter]: {
    operation: filter === 'item_category.name' ? 'ilike' : 'ilike',
    value: `%${value}%`,
  },
})

const buildItemCategorySearchQuery = (value: string, filter: string): QueryFilters => ({
  [filter]: {
    operation: 'ilike',
    value: `%${value}%`,
  },
})

const buildItemPropertySearchQuery = (value: string, filter: string): QueryFilters => {
  const operation = filter === 'field_type' ? '==' : 'ilike'
  const normalizedValue = filter === 'field_type' ? value.toLowerCase() : value
  const targetValue = operation === '==' ? normalizedValue : `%${normalizedValue}%`
  return {
    [filter]: {
      operation,
      value: targetValue,
    },
  }
}

const buildEmptyStateMessage = (label: string) => `No ${label.toLowerCase()} found.`
const buildLoadingStateMessage = (label: string) => `Loading ${label.toLowerCase()}...`
const buildCreateLabel = (noun: string) => `Create ${noun}`
const buildCounterLabel = (label: string) => (count: number) => `${count} ${label.toLowerCase()}`

type SearchInjection = {
  tab: ItemPropertiesTabKey
  value: string
  filter: string
  id: number
}

const POPUP_PAYLOAD_KEYS: Record<ItemPropertiesTabKey, string> = {
  states: 'itemState',
  positions: 'itemPosition',
  types: 'itemType',
  categories: 'itemCategory',
  'sub-properties': 'itemProperty',
}

export function ItemPropertiesPanel() {
  const [activeTab, setActiveTab] = useState<ItemPropertiesTabKey>(DEFAULT_TAB)
  const [searchInjection, setSearchInjection] = useState<SearchInjection | null>(null)
  const popupManager = useResourceManager('settingsPopupManager')
  const itemPropertiesService = useMemo(() => new ItemPropertiesService(), [])

  const itemStateServices = useMemo(
    () => ({
      queryAllService: () => itemPropertiesService.queryItemStates(),
      queryByInputService: (queryFilters: QueryFilters) => itemPropertiesService.queryItemStates(queryFilters),
    }),
    [itemPropertiesService],
  )

  const itemPositionServices = useMemo(
    () => ({
      queryAllService: () => itemPropertiesService.queryItemPositions(),
      queryByInputService: (queryFilters: QueryFilters) => itemPropertiesService.queryItemPositions(queryFilters),
    }),
    [itemPropertiesService],
  )

  const itemTypeServices = useMemo(
    () => ({
      queryAllService: () => itemPropertiesService.queryItemTypes(),
      queryByInputService: (queryFilters: QueryFilters) => itemPropertiesService.queryItemTypes(queryFilters),
    }),
    [itemPropertiesService],
  )

  const itemCategoryServices = useMemo(
    () => ({
      queryAllService: () => itemPropertiesService.queryItemCategories(),
      queryByInputService: (queryFilters: QueryFilters) => itemPropertiesService.queryItemCategories(queryFilters),
    }),
    [itemPropertiesService],
  )

  const itemPropertyServices = useMemo(
    () => ({
      queryAllService: () => itemPropertiesService.queryItemProperties(),
      queryByInputService: (queryFilters: QueryFilters) => itemPropertiesService.queryItemProperties(queryFilters),
    }),
    [itemPropertiesService],
  )

  const activeConfig = useMemo(
    () => TAB_OPTIONS.find((tab) => tab.key === activeTab) ?? TAB_OPTIONS[0],
    [activeTab],
  )

  const handleNavigate = (payload: ItemPropertyNavigatePayload) => {
    setActiveTab(payload.tab)
    setSearchInjection({
      ...payload,
      id: Date.now(),
    })
  }

  const handleEdit = (tab: ItemPropertiesTabKey, entity: unknown) => {
    const payloadKey = POPUP_PAYLOAD_KEYS[tab]
    popupManager.open({
      key: POPUP_KEYS[tab],
      payload: {
        mode: 'update',
        [payloadKey]: entity,
      },
    })
  }

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'states': {
        const meta = TAB_MAP.states
        return (
          <SectionPanel<ItemStateDetails, QueryFilters>
            key="states-panel"
            eyebrow={meta.label}
            title={meta.title}
            description={meta.description}
            dataManagerKey={DATASET_KEYS.states}
            createButtonLabel={buildCreateLabel(PANEL_NOUNS.states)}
            emptyStateMessage={buildEmptyStateMessage(meta.label)}
            loadingStateMessage={buildLoadingStateMessage(meta.label)}
            counterLabel={buildCounterLabel(meta.label)}
            onCreate={() => popupManager.open({ key: POPUP_KEYS.states })}
            services={itemStateServices}
            defaultSearchFilter={DEFAULT_SEARCH_FILTER}
            searchInjection={
              searchInjection?.tab === 'states'
                ? { id: searchInjection.id, value: searchInjection.value, filter: searchInjection.filter }
                : null
            }
            renderObjectCard={(state) => <ItemStateCard state={state} onEdit={(candidate) => handleEdit('states', candidate)} />}
          />
        )
      }
      case 'positions': {
        const meta = TAB_MAP.positions
        return (
          <SectionPanel<ItemPositionDetails, QueryFilters>
            key="positions-panel"
            eyebrow={meta.label}
            title={meta.title}
            description={meta.description}
            dataManagerKey={DATASET_KEYS.positions}
            createButtonLabel={buildCreateLabel(PANEL_NOUNS.positions)}
            emptyStateMessage={buildEmptyStateMessage(meta.label)}
            loadingStateMessage={buildLoadingStateMessage(meta.label)}
            counterLabel={buildCounterLabel(meta.label)}
            onCreate={() => popupManager.open({ key: POPUP_KEYS.positions })}
            services={itemPositionServices}
            defaultSearchFilter={DEFAULT_SEARCH_FILTER}
            searchInjection={
              searchInjection?.tab === 'positions'
                ? { id: searchInjection.id, value: searchInjection.value, filter: searchInjection.filter }
                : null
            }
            renderObjectCard={(position) => (
              <ItemPositionCard position={position} onEdit={(candidate) => handleEdit('positions', candidate)} />
            )}
          />
        )
      }
      case 'types': {
        const meta = TAB_MAP.types
        return (
          <SectionPanel<ItemTypeDetails, QueryFilters>
            key="types-panel"
            eyebrow={meta.label}
            title={meta.title}
            description={meta.description}
            dataManagerKey={DATASET_KEYS.types}
            createButtonLabel={buildCreateLabel(PANEL_NOUNS.types)}
            emptyStateMessage={buildEmptyStateMessage(meta.label)}
            loadingStateMessage={buildLoadingStateMessage(meta.label)}
            counterLabel={buildCounterLabel(meta.label)}
            onCreate={() => popupManager.open({ key: POPUP_KEYS.types })}
            services={itemTypeServices}
            searchFilterOptions={TYPE_FILTER_OPTIONS}
            defaultSearchFilter={TYPE_FILTER_OPTIONS[0].value}
            searchBuildQuery={buildItemTypeSearchQuery}
            searchInjection={
              searchInjection?.tab === 'types'
                ? { id: searchInjection.id, value: searchInjection.value, filter: searchInjection.filter }
                : null
            }
            renderObjectCard={(itemType) => (
              <ItemTypeCard
                itemType={itemType}
                onEdit={(candidate) => handleEdit('types', candidate)}
                onNavigate={handleNavigate}
              />
            )}
          />
        )
      }
      case 'categories': {
        const meta = TAB_MAP.categories
        return (
          <SectionPanel<ItemCategoryDetails, QueryFilters>
            key="categories-panel"
            eyebrow={meta.label}
            title={meta.title}
            description={meta.description}
            dataManagerKey={DATASET_KEYS.categories}
            createButtonLabel={buildCreateLabel(PANEL_NOUNS.categories)}
            emptyStateMessage={buildEmptyStateMessage(meta.label)}
            loadingStateMessage={buildLoadingStateMessage(meta.label)}
            counterLabel={buildCounterLabel(meta.label)}
            onCreate={() => popupManager.open({ key: POPUP_KEYS.categories })}
            services={itemCategoryServices}
            searchFilterOptions={CATEGORY_FILTER_OPTIONS}
            defaultSearchFilter={CATEGORY_FILTER_OPTIONS[0].value}
            searchBuildQuery={buildItemCategorySearchQuery}
            searchInjection={
              searchInjection?.tab === 'categories'
                ? { id: searchInjection.id, value: searchInjection.value, filter: searchInjection.filter }
                : null
            }
            renderObjectCard={(itemCategory) => (
              <ItemCategoryCard
                category={itemCategory}
                onEdit={(candidate) => handleEdit('categories', candidate)}
                onNavigate={handleNavigate}
              />
            )}
          />
        )
      }
      case 'sub-properties':
      default: {
        const meta = TAB_MAP['sub-properties']
        return (
          <SectionPanel<ItemPropertyPayload, QueryFilters>
            key="sub-properties-panel"
            eyebrow={meta.label}
            title={meta.title}
            description={meta.description}
            dataManagerKey={DATASET_KEYS['sub-properties']}
            createButtonLabel={buildCreateLabel(PANEL_NOUNS['sub-properties'])}
            emptyStateMessage={buildEmptyStateMessage(meta.label)}
            loadingStateMessage={buildLoadingStateMessage(meta.label)}
            counterLabel={buildCounterLabel(meta.label)}
            onCreate={() => popupManager.open({ key: POPUP_KEYS['sub-properties'] })}
            services={itemPropertyServices}
            searchFilterOptions={PROPERTY_FILTER_OPTIONS}
            defaultSearchFilter={PROPERTY_FILTER_OPTIONS[0].value}
            searchBuildQuery={buildItemPropertySearchQuery}
            searchInjection={
              searchInjection?.tab === 'sub-properties'
                ? { id: searchInjection.id, value: searchInjection.value, filter: searchInjection.filter }
                : null
            }
            renderObjectCard={(itemProperty) => (
              <ItemPropertyCard
                property={itemProperty}
                onEdit={(candidate) => handleEdit('sub-properties', candidate)}
                onNavigate={handleNavigate}
              />
            )}
          />
        )
      }
    }
  }, [
    activeTab,
    popupManager,
    itemStateServices,
    itemPositionServices,
    itemTypeServices,
    itemCategoryServices,
    itemPropertyServices,
    searchInjection,
  ])

  return (
    <div className="space-y-8  ">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Item properties</p>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{activeConfig.title}</p>
          <p className="text-sm text-[var(--color-muted)]">{activeConfig.description}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Item property panels">
        {TAB_OPTIONS.map((tab) => {
          const isActive = tab.key === activeTab
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`item-properties-panel-${tab.key}`}
              onClick={() => {
                setSearchInjection(null)
                setActiveTab(tab.key)
              }}
              className={`flex min-w-[180px] flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive
                  ? 'bg-[var(--color-accent)] text-[var(--color-text)] shadow-sm'
                  : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
            >
              <span aria-hidden="true">
                <Icon
                  className={`app-icon h-4 w-4 ${
                    isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
                  }`}
                />
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div id={`item-properties-panel-${activeConfig.key}`} role="tabpanel" aria-live="polite">
        {activePanel}
      </div>
    </div>
  )
}
