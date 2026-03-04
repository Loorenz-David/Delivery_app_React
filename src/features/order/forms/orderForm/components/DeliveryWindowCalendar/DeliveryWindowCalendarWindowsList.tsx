import type { DeliveryWindowDisplayRow } from '../../flows/orderFormDeliveryWindows.flow'
import { BasicButton } from '@/shared/buttons/BasicButton'

type DeliveryWindowCalendarWindowsListProps = {
  rows: DeliveryWindowDisplayRow[]
  onClearAll: () => void
  onRemove: (row: DeliveryWindowDisplayRow) => void
  onEdit: (row: DeliveryWindowDisplayRow) => void
}

export const DeliveryWindowCalendarWindowsList = ({
  rows,
  onClearAll,
  onRemove,
  onEdit,
}: DeliveryWindowCalendarWindowsListProps) => {
  return (
    <div className="rounded-xl border border-[var(--color-border-accent)] bg-[var(--color-page)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-text)]">Delivery windows</span>
        <BasicButton
          params={{
            variant: 'text',
            onClick: onClearAll,
            className:
              'h-auto border-0 bg-transparent px-0 py-0 text-[10px] font-normal normal-case tracking-normal text-[var(--color-muted)] underline hover:bg-transparent',
          }}
        >
          Clear all
        </BasicButton>
      </div>
      {rows.length ? (
        <div className="flex flex-col divide-y divide-[var(--color-border-accent)]">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-2 text-xs">
              <div className="flex gap-2 text-[var(--color-text)]">
                <span className="font-semibold">{row.date}</span>
                <span>{row.start}</span>
                <span>to</span>
                <span>{row.end}</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[var(--color-border-accent)] gap-x-3">
                <BasicButton
                  params={{
                    variant: 'text',
                    onClick: () => onEdit(row),
                    className:
                      'h-auto border-0 bg-transparent px-0 py-0 text-[10px]  text-[var(--color-dark-blue)] ',
                  }}
                >
                  Edit
                </BasicButton>
                <BasicButton
                  params={{
                    variant: 'text',
                    onClick: () => onRemove(row),
                    className:
                      'h-auto border-0 bg-transparent px-0 py-0 text-[10px] font-normal normal-case tracking-normal text-red-500 hover:bg-red-100',
                  }}
                >
                  Remove
                </BasicButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-[var(--color-muted)]">No delivery windows selected yet.</div>
      )}
    </div>
  )
}
