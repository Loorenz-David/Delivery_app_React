import { CustomTimePicker } from '@/shared/inputs/CustomTimePicker'
import { BasicButton } from '@/shared/buttons/BasicButton'
import type { DeliveryWindowCalendarDensity } from './DeliveryWindowCalendarDensity.flow'

type DeliveryWindowCalendarEditorProps = {
  isOpen: boolean
  selectedLocalDates: string[]
  startTime: string | null
  endTime: string | null
  onChangeStartTime: (value: string | null) => void
  onChangeEndTime: (value: string | null) => void
  onCancel: () => void
  onApply: () => void
  density?: DeliveryWindowCalendarDensity
}

export const DeliveryWindowCalendarEditor = ({
  isOpen,
  selectedLocalDates,
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  onCancel,
  onApply,
  density = 'regular',
}: DeliveryWindowCalendarEditorProps) => {
  if (!isOpen) {
    return null
  }

  const isCompact = density === 'compact'

  return (
    <div className={`${isCompact ? 'rounded-lg p-2.5' : 'rounded-xl p-3'} border border-[var(--color-border-accent)] bg-[var(--color-page)]`}>
      <div className={`${isCompact ? 'gap-1.5' : 'gap-2'} flex items-start`}>
        <div className={`${isCompact ? 'pb-1 text-[11px]' : 'pb-2 text-xs'} text-nowrap font-semibold text-[var(--color-text)]`}>Set time window</div>
        <div className=" flex overflow-x-auto min-w-0">
          <span className={`${isCompact ? 'pb-1 text-[10px]' : 'pb-2 text-[11px]'} text-[var(--color-muted)] text-nowrap`}>
            {selectedLocalDates.length ? selectedLocalDates.join(', ') : 'No dates selected'} 
          </span>
        </div>
      </div>
      <div className={`${isCompact ? 'px-1 py-1.5' : 'px-2 py-2'} flex items-end justify-between`}>
        <div className={`${isCompact ? 'gap-1.5' : 'gap-2'} grid grid-cols-[1fr_auto_1fr] items-center`}>
          <CustomTimePicker 
            selectedTime={startTime} onChange={(value) => onChangeStartTime(value || null)} 
            className={`${isCompact ? 'max-w-[88px] px-1.5 py-0.5' : 'max-w-[100px] px-2 py-1'} border-1 border-[var(--color-border-accent)] bg-white`}
          />
          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[var(--color-muted)]`}>to</span>
          <CustomTimePicker 
            selectedTime={endTime} onChange={(value) => onChangeEndTime(value || null)} 
            className={`${isCompact ? 'max-w-[88px] px-1.5 py-0.5' : 'max-w-[100px] px-2 py-1'} border-1 border-[var(--color-border-accent)] bg-white`}  
          />
        </div>
        <div className={`${isCompact ? 'mt-2 gap-2' : 'mt-3 gap-3'} flex justify-end`}>
          <BasicButton
            params={{
              variant: 'secondary',
              onClick: onCancel,
              className:
                `${isCompact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'} border-[var(--color-border-accent)] text-[var(--color-muted)]`,
            }}
          >
            Cancel
          </BasicButton>
          <BasicButton
            params={{
              variant: 'primary',
              onClick: onApply,
              style:{backgroundColor:'var(--color-dark-blue)'},
              className:
                `${isCompact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'} text-[var(--color-page)] hover:bg-[var(--color-dark-blue)]/90`,
            }}
          >
            Apply
          </BasicButton>
        </div>

      </div>
    </div>
  )
}
