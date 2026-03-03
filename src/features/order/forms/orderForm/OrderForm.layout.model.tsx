import type { PopoverSelectOption } from '@/shared/inputs/OptionPopoverSelect'

import { useOrderForm } from './OrderForm.context'

export const ORDER_PLAN_OBJECTIVE_OPTIONS: Array<PopoverSelectOption<string>> = [
  { label: 'Local delivery', value: 'local_delivery' },
  { label: 'International shipping', value: 'international_shipping' },
  { label: 'Store pickup', value: 'store_pickup' },
]

export const toDateValue = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export const useOrderFormLayoutModel = () => {
  const { formState, warnings, formSetters, actions, itemEditor, meta, closeController } = useOrderForm()
  const { mode, creationDate, visibleItemDrafts, isLoadingInitialItems } = meta
  const { handleSave, handleDelete } = actions
  const { isItemEditorOpen, itemEditorPayload, openItemCreateForm, openItemEditForm, closeItemEditor } = itemEditor

  return {
    label: mode === 'create' ? 'Create Order' : 'Edit Order',
    mode,
    creationDate,
    formState,
    warnings,
    formSetters,
    handleSave,
    handleDelete,
    isItemEditorOpen,
    itemEditorPayload,
    openItemCreateForm,
    openItemEditForm,
    closeItemEditor,
    visibleItemDrafts,
    isLoadingInitialItems,
    closeController,
  }
}

export type OrderFormLayoutModel = ReturnType<typeof useOrderFormLayoutModel>
