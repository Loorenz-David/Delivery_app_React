import { BasicButton } from '@/shared/buttons/BasicButton'

type OrderFormFooterProps = {
  onSendForm: () => void
  onSaveOrder: () => void
  sendDisabled?: boolean
  saveDisabled?: boolean
}

export const OrderFormFooter = ({
  onSendForm,
  onSaveOrder,
  sendDisabled = false,
  saveDisabled = false,
}: OrderFormFooterProps) => {
  return (
    <footer className="absolute bottom-0 left-0 flex w-full items-center justify-end gap-3 rounded-b-xl border-t border-[var(--color-border)] bg-[var(--color-page)] px-6 py-4">
      <BasicButton
        params={{
          variant: 'secondary',
          onClick: onSendForm,
          disabled: sendDisabled,
          className: 'px-5 py-3',
        }}
      >
        Send Form
      </BasicButton>

      <BasicButton
        params={{
          variant: 'primary',
          onClick: onSaveOrder,
          disabled: saveDisabled,
          className: 'px-5 py-3',
        }}
      >
        Save Order
      </BasicButton>
    </footer>
  )
}
