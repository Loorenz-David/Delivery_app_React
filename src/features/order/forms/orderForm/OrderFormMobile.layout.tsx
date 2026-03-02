import { OrderFormFooter } from './OrderFormFooter'
import { OrderFormFields } from './OrderFormFields'
import { OrderFormHeader } from './OrderFormHeader'
import { OrderFormItemsPanel } from './OrderFormItemsPanel'
import type { OrderFormLayoutModel } from './OrderForm.layout.model'
import type { OrderFormExternalFlow } from './useOrderFormExternalFlow'

export const OrderFormMobileLayout = ({
  model,
  externalFlow,
}: {
  model: OrderFormLayoutModel
  externalFlow: OrderFormExternalFlow
}) => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden pb-28">
      <div className="relative flex w-full min-h-0 flex-col bg-[var(--color-page)]">
        <OrderFormHeader
          label={model.label}
          mode={model.mode}
          creationDate={model.creationDate}
          isMobile={true}
          onClose={model.closeController.requestClose}
        />

        <OrderFormFields model={model} compact={true} />
      </div>

      <OrderFormItemsPanel model={model} compact={true} />

      {!model.isItemEditorOpen ? (
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
          isMobile={true}
        />
      ) : null}
    </div>
  )
}
