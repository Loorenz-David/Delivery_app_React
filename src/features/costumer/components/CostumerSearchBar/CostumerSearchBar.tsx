import {  useMemo} from 'react'
import { SearchFilterBar } from '@/shared/searchBars'

import { runCostumerQueryFlow } from '../../flows/costumerQuery.flow'


import { useCostumerSearch } from '../../flows/useCostumerSearch.flow'
import { PlusIcon } from '@/assets/icons'
import type { CostumerSearchBarProps } from './CostumerSearchBar.types'


export const shouldRunCostumerQuery = (input: string): boolean => input.trim().length > 0



export const CostumerSearchBar = ({
  onSelectCostumer,
  placeholder = 'Search costumers...',
  className,
  handleStartCreate
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
          <div className="flex w-full justify start items-center py-2 px-3 gap-3 cursor-pointer hover:bg-[var(--color-muted)]/10"
            onClick={()=>handleStartCreate()}
          > 
          <div className="p-1 border-1 border-dashed border-[var(--color-muted)]/80 rounded-full">
            <PlusIcon className="h-3 w-3 text-[var(--color-muted)]/80"/>
          </div>
            <span className="text-[12px] text-[var(--color-muted)]"> 
              Create Costumer
            </span>
          </div>
        {!hasQuery ? (
          <div className=" "></div>
        ) : isLoading ? (
          <div className="px-3 py-2 text-xs text-[var(--color-muted)] h-[200px]">Searching...</div>
        ) : error ? (
          <div className="px-3 py-2 text-xs text-red-500 h-[200px]">{error}</div>
        ) : results.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[var(--color-muted)] h-[200px]">No costumers found.</div>
        ) : (
          <div className="flex flex-col h-[200px] pt-2">
            {results.map((costumer) => {
              const fullName = `${costumer.first_name} ${costumer.last_name}`.trim()

              return (
                <button
                  key={costumer.client_id}
                  type="button"
                  onClick={() => onSelectCostumer(costumer)}
                  className="flex w-full flex-col border-b border-[var(--color-border)]/40 px-3 py-2 text-left cursor-pointer last:border-b-0 hover:bg-[var(--color-muted)]/10"
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
