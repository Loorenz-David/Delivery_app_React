import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'

import { useItemFlow } from '../../hooks/useItemFlow'
import type { Item, ItemPopupPayload } from '../../types'

import { ItemFormContextProvider } from './ItemForm.context'
import { useItemFormValidation } from './ItemForm.validation'
import { useItemFormWarnings } from './ItemForm.warnings'
import { useItemFormSubmit } from './useItemFormSubmit'
import { useItemFormSetters } from './useItemFormSetters'
import { useItemFormConfig } from './useItemFormConfig'
import type { ItemFormPopupBindings } from './useItemFormConfig'
import { useItemConfigurations } from './useItemConfigurations'
import { buildInitialItemDraft } from './form/itemForm.factory'

export const ItemFormProvider = ({
  payload,
  children,
  closeItemForm,
  popupBindings,
}: {
  payload: ItemPopupPayload | undefined
  children: ReactNode
  closeItemForm: () => void
  popupBindings?: ItemFormPopupBindings
}) => {
  if (!payload) {
    throw new Error('ItemForm payload is missing.')
  }

  const autonomousItemId = payload.mode === 'autonomous' ? payload.itemId ?? null : null
  const { item: existingItem } = useItemFlow({ itemId: autonomousItemId })

  const [formState, setFormState] = useState<Item>(() =>
    buildInitialItemDraft({ payload, existingItem }),
  )

  const initialFormRef = useRef<Item | null>(null)
  const warnings = useItemFormWarnings()
  const selectedItemTypeName = formState.item_type
  const {
    itemTypeOptions, 
    selectedItemTypeProperties, 
    setSelectedItemType
  } = useItemConfigurations({ selectedItemTypeName })

  const setters = useItemFormSetters({
      setFormState,
      warnings,
      setSelectedItemType
    })

  useItemFormConfig({
    payload,
    formState,
    initialFormRef,
    popupBindings,
  })

  useEffect(() => {
    const initialDraft = buildInitialItemDraft({ payload, existingItem })
    setFormState(initialDraft)
    makeInitialFormCopy(initialFormRef, initialDraft)
  }, [autonomousItemId, existingItem, payload])

  const { validateForm } = useItemFormValidation({ formState, warnings })

  const submitters = useItemFormSubmit({
    payload,
    formState,
    validateForm,
    initialFormRef,
    closeItemForm,
  })

  const value = useMemo(
    () => ({
      payload,
      setters,
      currentItem: existingItem,
      formState,
      setFormState,
      initialFormRef,
      warnings,
      itemTypeOptions, 
      selectedItemTypeProperties, 
      ...submitters,
    }),
    [
      existingItem,
      formState,
      itemTypeOptions,
      payload,
      selectedItemTypeProperties,
      setters,
      submitters,
      warnings,
    ],
  )

  return <ItemFormContextProvider value={value}>{children}</ItemFormContextProvider>
}
