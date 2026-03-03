import {  useMemo} from 'react'
import { SearchFilterBar } from '@/shared/searchBars'

import { runCostumerQueryFlow } from '../../flows/costumerQuery.flow'


import type { CostumerSearchBarProps } from './CostumerSearchBar.types'
import { useCostumerSearch } from '../../flows/useCostumerSearch.flow'

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_LIMIT = 10

export const shouldRunCostumerQuery = (input: string): boolean => input.trim().length > 0



export const CostumerSearchBar = ({
  onSelectCostumer,
  placeholder = 'Search costumers...',
  className,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  limit = DEFAULT_LIMIT,
  initialQuery = '',
}: CostumerSearchBarProps) => {
  
  
  const {queryCostumers , visibleCostumers, isLoading, error} = runCostumerQueryFlow()

  const { searchInput, setSearchInput } = useCostumerSearch({
    debounceMs:400,
    queryCostumers
  })
  
  const results = useMemo(() => visibleCostumers, [visibleCostumers])

  const hasQuery = shouldRunCostumerQuery(searchInput)

  return (
    <div className={className}>
      <SearchFilterBar
        placeholder={placeholder}
        applySearch={(input) => setSearchInput(input)}
        hideFilterIcon
      />

      <div className="mt-2  overflow-y-auto rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-page)]/50">
        {!hasQuery ? (
          <div className="px-3 py-2 text-xs text-[var(--color-muted)] ">Type to search costumers.</div>
        ) : isLoading ? (
          <div className="px-3 py-2 text-xs text-[var(--color-muted)] h-[300px]">Searching...</div>
        ) : error ? (
          <div className="px-3 py-2 text-xs text-red-500 h-[300px]">{error}</div>
        ) : results.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[var(--color-muted)] h-[300px]">No costumers found.</div>
        ) : (
          <div className="flex flex-col h-[300px]">
            {results.map((costumer) => {
              const fullName = `${costumer.first_name} ${costumer.last_name}`.trim()

              return (
                <button
                  key={costumer.client_id}
                  type="button"
                  onClick={() => onSelectCostumer(costumer)}
                  className="flex w-full flex-col border-b border-[var(--color-border)]/40 px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-muted)]/10"
                >
                  <span className="text-sm text-[var(--color-text)]">{fullName}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{costumer.email ?? 'No email'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
