import { PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import type { DeliveryWindowCalendarDensity } from '../../DeliveryWindowCalendarDensity.flow'

type DeliveryWindowCalendarSelectionBannerProps = {
  label: string
  addDisabled: boolean
  onAdd: () => void
  density?: DeliveryWindowCalendarDensity
}

export const DeliveryWindowCalendarSelectionBanner = ({
  label,
  addDisabled,
  onAdd,
  density = 'regular',
}: DeliveryWindowCalendarSelectionBannerProps) => {
  const isCompact = density === 'compact'

  return (
    <div className={`${isCompact ? 'mb-2.5 gap-1.5 rounded-lg px-2.5 py-1.5' : 'mb-3 gap-2 rounded-xl px-3 py-2'} flex flex-wrap items-center justify-between border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8`}>
      <span className={`${isCompact ? 'text-xs' : 'text-sm md:text-base'} font-semibold text-[var(--color-dark-blue)]`}>{label}</span>
      <BasicButton
        params={{
          variant: 'primary',
          onClick: onAdd,
          disabled: addDisabled,
          style: { backgroundColor: 'var(--color-dark-blue)' },
          className:
            `${isCompact ? 'gap-1 px-2 py-1 text-[11px]' : 'gap-1.5 px-3 py-1.5 text-sm md:gap-2 md:px-4 md:py-2 md:text-base'} flex items-center whitespace-nowrap rounded-lg font-semibold text-[var(--color-page)] hover:bg-[var(--color-dark-blue)]/90`,
        }}
      >
        <PlusIcon className={isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3 md:h-3.5 md:w-3.5'} />
        Add Time Window
      </BasicButton>
    </div>
  )
}
