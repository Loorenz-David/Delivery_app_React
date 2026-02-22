import {  OrderIcon, PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'
import type { OrderQueryFilters, OrderQueryStringQueries } from '../../types/orderMeta'
import { ActiveFilterPills, SearchFilterBar } from '@/shared/searchBars'
import { filterConfig } from '../../domain/orderFilterConfig'



type OrderMainHeaderProps = {
  onCreate: () => void
  applySearch: (input: string) => void
  applyFilters: (filters: OrderQueryFilters) => void
  updateFilters: (key: OrderQueryStringQueries, value: unknown) => void
  deleteFilter: (key: OrderQueryStringQueries) => void
  query: {
    q: string
    filters: OrderQueryFilters
  }
}

export const OrderMainHeader = ({ onCreate, applySearch, deleteFilter, updateFilters, query }: OrderMainHeaderProps) => {
  const filterLabelMap = filterConfig.reduce<Record<string, string>>((acc, filter) => {
    if (filter.type === 'option') {
      acc[filter.key] = filter.label
    }
    return acc
  }, {})

  return (
    <>
      <SectionHeader
        title="Orders"
        icon={<OrderIcon className="h-6 w-6 fill-[var(--color-muted)]" />}
        closeButton={false}
      />
      <div className="flex flex-col">
        <div className="flex gap-4 p-4 pb-3">
          <SearchFilterBar
            placeholder="Search orders..."
            applySearch={applySearch}
            config={filterConfig}
            updateFilter={(key, value) => updateFilters(key as OrderQueryStringQueries, value)}
            filters={query.filters}
          />

          <BasicButton
            key="order-main-create"
            params={{
              variant: 'primary',
              onClick: onCreate,
              ariaLabel: 'Create order',
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
            Order
          </BasicButton>
        </div>
        <div className="flex w-full px-2">

          <ActiveFilterPills
            className="px-4"
            filters={query.filters}
            removeFilter={(key) => deleteFilter(key as OrderQueryStringQueries)}
            formatFilterLabel={(key) => filterLabelMap[key] ?? key}
          />
        </div>
      </div>
    </>

  )
}
