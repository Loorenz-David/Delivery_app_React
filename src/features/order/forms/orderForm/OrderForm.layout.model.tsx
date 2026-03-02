import { useCallback, useEffect, useState } from 'react'

import type { PopoverSelectOption } from '@/shared/inputs/OptionPopoverSelect'

import { useOrderForm } from './OrderForm.context'

export type OrderFormSection = 'details' | 'client_information' | 'date_times'

const ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY = 'orderForm.lastOpenSection'
const isBrowser = typeof window !== 'undefined'

const isOrderFormSection = (value: string): value is OrderFormSection =>
  value === 'details' || value === 'client_information' || value === 'date_times'

const persistLastOpenSection = (section: OrderFormSection) => {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY, section)
  } catch {
    // Ignore storage failures to avoid blocking form rendering.
  }
}

const getLastOpenSection = (): OrderFormSection | null => {
  if (!isBrowser) return null
  try {
    const storedSection = window.localStorage.getItem(ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY)
    if (!storedSection) return null
    return isOrderFormSection(storedSection) ? storedSection : null
  } catch {
    return null
  }
}

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

  const [openSection, setOpenSection] = useState<OrderFormSection | null>(null)
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(
    () => (formState.client_secondary_phone?.number ?? '').trim().length > 0,
  )

  const handleShowSecondaryPhone = useCallback(() => {
    setShowSecondaryPhone(true)
  }, [])

  const handleSectionToggle = useCallback((section: OrderFormSection) => {
    setOpenSection((prev) => {
      const nextSection = prev === section ? null : section
      if (nextSection) {
        persistLastOpenSection(nextSection)
      }
      return nextSection
    })
  }, [])

  const handleHideSecondaryPhone = useCallback(() => {
    setShowSecondaryPhone(false)
    formSetters.handleSecondaryPhone({
      ...formState.client_secondary_phone,
      number: '',
    })
  }, [formSetters, formState.client_secondary_phone])

  useEffect(() => {
    if ((formState.client_secondary_phone?.number ?? '').trim().length > 0) {
      setShowSecondaryPhone(true)
    }
  }, [formState.client_secondary_phone?.number])

  useEffect(() => {
    const lastSection = getLastOpenSection()
    if (!lastSection) return

    setOpenSection(lastSection)
  }, [])

  return {
    label: mode === 'create' ? 'Create Order' : 'Edit Order',
    mode,
    creationDate,
    formState,
    warnings,
    formSetters,
    openSection,
    showSecondaryPhone,
    handleSectionToggle,
    handleShowSecondaryPhone,
    handleHideSecondaryPhone,
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
