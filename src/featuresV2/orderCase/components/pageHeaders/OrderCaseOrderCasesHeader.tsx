import { ArchiveIcon,  PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'

type OrderCaseOrderCasesHeaderProps = {

  orderReference?: string
  onCreateCase: () => void
}

export const OrderCaseOrderCasesHeader = ({ orderReference, onCreateCase }: OrderCaseOrderCasesHeaderProps) => {
  return (
    <>
      <SectionHeader
        title={
          <div className="flex flex-col ">
            <span className="font-semibold text-lg text-[var(--color-muted)]/80">
              Order Cases
            </span>
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                Order # { orderReference }
              </span>
          </div>
        }
        icon={<ArchiveIcon className="h-6 w-6 text-[var(--color-muted)]" />}
        closeButton
      />

      <div className="flex items-center justify-end gap-3 p-3 pt-4">

        <BasicButton
          params={{
            variant: 'primary',
            onClick: onCreateCase,
            ariaLabel: 'Create case',
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
          Create Case
        </BasicButton>
      </div>
    </>
  )
}
