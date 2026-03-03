import { CloseIcon, SingleOrderIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'

type OrderFormHeaderProps = {
  label: string

  isMobile: boolean
  orderReference?: string
  onClose?: () => void
}

export const OrderFormHeader = ({ label, orderReference, isMobile, onClose }: OrderFormHeaderProps) => (
  <header
    className={`flex items-center justify-between gap-4 border-b border-[var(--color-border)] ${
      isMobile ? 'px-3 pb-4 pt-4' : 'px-6 py-3'
    }`}
  >
    <div className="flex items-center justify-center rounded-full bg-[var(--color-muted)]/12 p-2">
      <SingleOrderIcon className="h-6 w-6 text-[var(--color-muted)]" />
    </div>

    <div className="flex flex-col  items-start justify-start">

      <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
      {orderReference && 
        <span className="text-[10px]">
          {orderReference}
        </span>
      }
     
    </div>

    <div className="flex flex-1 items-center justify-end">
      <BasicButton
        params={{
          variant: 'rounded',
          onClick: onClose,
          ariaLabel: 'Close order form',
          style: { border: '1px solid rgb(var(--color-muted-r), 0.4)'  },
        }}
      >
        <CloseIcon className="app-icon h-4 w-4" />
      </BasicButton>
    </div>
  </header>
)
