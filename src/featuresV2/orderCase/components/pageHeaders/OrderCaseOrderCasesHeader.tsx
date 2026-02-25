import { ArchiveIcon, PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'

type OrderCaseOrderCasesHeaderProps = {
  orderReference?: string
  onCreateCase: () => void
  onClose: () => void
}

export const OrderCaseOrderCasesHeader = ({
  orderReference,
  onCreateCase,
  onClose,
}: OrderCaseOrderCasesHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between gap-3  px-4 py-3 bg-[var(--color-primary)] shadow-md"
        style={{ borderRadius:'0 0 20px 20px'}}
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-[var(--color-muted)]/30 px-3 py-3">
            <ArchiveIcon className="h-6 w-6 text-[var(--color-page)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-[var(--color-page)]/90">Order Cases</span>
            <span className="text-xs font-semibold text-[var(--color-page)]/70">Order # {orderReference}</span>
          </div>
        </div>
        <BasicButton
          params={{
            variant: 'textInvers',
            onClick: onClose,
            ariaLabel: 'Close order cases',
          }}
        >
          Close
        </BasicButton>
      </div>

      <div className="flex items-center justify-end gap-3 p-3 pt-4">
        <BasicButton
          params={{
            variant: 'primary',
            onClick: onCreateCase,
            ariaLabel: 'Create case',
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
           Case
        </BasicButton>
      </div>
    </>
  )
}
