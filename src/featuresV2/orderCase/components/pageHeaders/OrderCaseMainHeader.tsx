import { useEffect } from 'react'

import { ArchiveIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { ActiveFilterPills, SearchFilterBar } from '@/shared/searchBars'

import { filterConfig } from '../../domain/orderCaseFilter.config'
import type { OrderCaseQueryFilters } from '../../types'

type OrderCaseMainHeaderProps = {
  applySearch: (input: string) => void
  updateFilters: (key: string, value: unknown) => void
  deleteFilter: (key: string) => void
  resetQuery: () => void
  onClose: () => void
  query: {
    q: string
    filters: OrderCaseQueryFilters
  }
}

export const OrderCaseMainHeader = ({
  applySearch,
  updateFilters,
  deleteFilter,
  resetQuery,
  onClose,
  query,
}: OrderCaseMainHeaderProps) => {
  const filterLabelMap = filterConfig.reduce<Record<string, string>>((acc, filter) => {
    if (filter.type === 'option') {
      acc[filter.key] = filter.label
    }
    return acc
  }, {})

  useEffect(() => {
    return () => {
      resetQuery()
    }
  }, [resetQuery])

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-[var(--color-muted)]/10 px-3 py-3">
            <ArchiveIcon className="h-6 w-6 text-[var(--color-muted)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-[var(--color-muted)]/80">
              Cases
            </span>
            <div className="flex">
              <span className="text-xs flex text-[var(--color-muted)] font-normal">
                0 open • 0 resolving 
              </span>
            </div>
          </div>
        </div>
        <BasicButton
          params={{
            variant: 'text',
            onClick: onClose,
            ariaLabel: 'Close cases',
          }}
        >
          Close
        </BasicButton>
      </div>

      <div className="flex flex-col">
        <div className="p-4 pb-3">
          <SearchFilterBar
            placeholder="Search cases..."
            applySearch={applySearch}
            config={filterConfig}
            updateFilter={(key, value) => updateFilters(key, value)}
            filters={query.filters}
          />
        </div>
        <ActiveFilterPills
          className="px-4"
          filters={query.filters}
          removeFilter={deleteFilter}
          formatFilterLabel={(key) => filterLabelMap[key] ?? key}
        />
      </div>
    </>
  )
}
