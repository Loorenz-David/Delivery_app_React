import { FilterIcon, OrderIcon, PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'
import type { PlanQueryFilters } from '../../types/planMeta'

type PlanMainHeaderProps = {
  onCreate: () => void
  applySearch: (input: string) => void
  applyFilters: (filters: PlanQueryFilters) => void
}

export const PlanMainHeader = ({ onCreate, applySearch, applyFilters }: PlanMainHeaderProps) => {
 

  return (
    <>
      <SectionHeader
        title="Plans"
        icon={<OrderIcon className="h-6 w-6 fill-[var(--color-muted)]" />}
        closeButton={false}
      />
      <div className="flex gap-4 p-4">
        
        <BasicButton
          key="order-main-create"
          params={{
            variant: 'primary',
            onClick: onCreate,
            ariaLabel: 'Create order',
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
          Plan
        </BasicButton>
      </div>
    </>

  )
}
