import { ArchiveIcon } from '@/assets/icons'
import { ActiveFilterPills, SearchFilterBar} from '@/shared/searchBars'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'
import type { OrderCaseQueryFilters } from '../../types'
import { useEffect } from 'react'
import { filterConfig } from '../../domain/orderCaseFilter.config'




type OrderCaseMainHeaderProps = {
  applySearch: (input: string) => void
  updateFilters: (key: string, value: unknown) => void
  deleteFilter: (key: string) => void
  resetQuery: ()=> void
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
  query,
}: OrderCaseMainHeaderProps) => {
  const filterLabelMap = filterConfig.reduce<Record<string, string>>((acc, filter) => {
      if (filter.type === 'option') {
        acc[filter.key] = filter.label
      }
      return acc
    }, {})
    
  useEffect(()=>{
    return () => {
      resetQuery()
    }
  }, [resetQuery])


  return (
    <>
      <SectionHeader
        title="Cases"
        icon={<ArchiveIcon className="h-6 w-6 text-[var(--color-muted)]" />}
        closeButton
      />
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

