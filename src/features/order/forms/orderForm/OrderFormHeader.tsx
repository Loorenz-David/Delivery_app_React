import { CloseIcon, SingleOrderIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'

import type { OrderFormMode } from './OrderForm.types'

type OrderFormHeaderProps = {
  label: string
  mode: OrderFormMode
  creationDate: string | null
  isMobile: boolean
  onClose?: () => void
}

export const OrderFormHeader = ({ label, mode, creationDate, isMobile, onClose }: OrderFormHeaderProps) => (
  <header
    className={`flex items-center justify-between gap-4 border-b border-[var(--color-border)] ${
      isMobile ? 'px-3 pb-4 pt-4' : 'px-6 py-4'
    }`}
  >
    <div className="flex items-center justify-center rounded-full bg-[var(--color-muted)]/20 p-3">
      <SingleOrderIcon className="h-6 w-6 text-[var(--color-muted)]" />
    </div>

    <div className="flex flex-col gap-1">
      <h2 className="font-semibold text-[var(--color-text)]">{label}</h2>
      {mode === 'edit' ? (
        <div className="flex text-xs text-[var(--color-muted)]">Creation date: {creationDate}</div>
      ) : null}
    </div>

    <div className="flex flex-1 items-center justify-end">
      <BasicButton
        params={{
          variant: 'rounded',
          onClick: onClose,
          ariaLabel: 'Close order form',
          style: { border: '1px solid rgb(var(--color-muted-r), 0.4)' },
        }}
      >
        <CloseIcon className="app-icon h-6 w-6" />
      </BasicButton>
    </div>
  </header>
)
