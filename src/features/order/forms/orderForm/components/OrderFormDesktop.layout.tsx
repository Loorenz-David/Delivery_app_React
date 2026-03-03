import { OrderFormFooter } from './OrderFormFooter'
import { OrderFormFields } from './OrderFormFields'
import { OrderFormHeader } from './OrderFormHeader'
import type { OrderFormLayoutModel } from '../OrderForm.layout.model'
import type { OrderFormExternalFlow } from '../useOrderFormExternalFlow'
import { OrderFormDesktopRightColumn } from './OrderFormDesktopRightColumn'

export const OrderFormDesktopLayout = ({
  model,
  externalFlow,
}: {
  model: OrderFormLayoutModel
  externalFlow: OrderFormExternalFlow
}) => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 gap-6">
      <div className="relative flex h-full w-[560px] min-w-0 shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-page)]">
        <OrderFormHeader
          label={model.label}
          mode={model.mode}
          creationDate={model.creationDate}
          isMobile={false}
          onClose={model.closeController.requestClose}
        />

        <OrderFormFields model={model} />

        <OrderFormFooter
          onSendForm={externalFlow.handleSendForm}
          onSaveOrder={model.handleSave}
          onDeleteOrder={
            model.mode === 'edit'
              ? () => {
                  void model.handleDelete()
                }
              : undefined
          }
          sendDisabled={externalFlow.employeeUserId <= 0}
        />
      </div>
      <OrderFormDesktopRightColumn model={model} />
    </div>
  )
}
