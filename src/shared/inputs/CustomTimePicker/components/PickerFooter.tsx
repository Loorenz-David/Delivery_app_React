import { BasicButton } from '@/shared/buttons/BasicButton'

type PickerFooterProps = {
  onCancel: () => void
  onDone: () => void
}

export const PickerFooter = ({ onCancel, onDone }: PickerFooterProps) => {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-accent)]/60 p-3">
      <BasicButton
        params={{
          variant: 'ghost',
          onClick: onCancel,
          className: 'px-3 py-1 text-xs text-[var(--color-muted)]',
          ariaLabel: 'Cancel time selection',
        }}
      >
        Cancel
      </BasicButton>
      <BasicButton
        params={{
          variant: 'secondary',
          onClick: onDone,
          className: 'px-3 py-1 text-xs',
          ariaLabel: 'Confirm time selection',
        }}
      >
        Done
      </BasicButton>
    </div>
  )
}
