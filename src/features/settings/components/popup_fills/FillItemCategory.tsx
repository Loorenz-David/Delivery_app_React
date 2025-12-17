import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import {
  ItemPropertiesService,
  type ItemCategoryDetails,
  type ItemTypeDetails,
} from '../../api/itemPropertiesService'
import { SelectItemPropertiesRelationships } from '../ui/SelectItemPropertiesRelationships'
import { useSettingsStore } from '../../../../store/settings/useSettingsStore'

type FillItemCategoryMode = 'create' | 'update'

export interface FillItemCategoryPayload {
  mode?: FillItemCategoryMode
  itemCategory?: ItemCategoryDetails | null
}

interface ItemCategoryFormState {
  name: string
  description: string
  item_types: number[]
}

type Snapshot = ItemCategoryFormState

export function FillItemCategory({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
}: ActionComponentProps<FillItemCategoryPayload>) {
  const mode: FillItemCategoryMode = payload?.mode ?? (payload?.itemCategory ? 'update' : 'create')
  const targetCategory = payload?.itemCategory ?? null

  const itemService = useMemo(() => new ItemPropertiesService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const upsertIntoCollection = useSettingsStore((state) => state.upsertIntoCollection)

  const [formState, setFormState] = useState<ItemCategoryFormState>(() => createInitialFormState(targetCategory))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typeOptions, setTypeOptions] = useState<ItemTypeDetails[]>([])
  const initialSnapshotRef = useRef<Snapshot>(createSnapshot(formState))

  const nameWarning = useInputWarning('Category name is required.')

  const fetchTypes = useCallback(async () => {
    const response = await itemService.queryItemTypes()
    setTypeOptions(response.data?.items ?? [])
  }, [itemService])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  useEffect(() => {
    const nextState = createInitialFormState(targetCategory)
    setFormState(nextState)
    nameWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCategory])

  useEffect(() => {
    if (!setPopupHeader) return
    setPopupHeader(
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Create item category' : `Update ${targetCategory?.name ?? 'item category'}`}
        </span>
      </div>,
    )
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetCategory?.name])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    return (
      initial.name !== formState.name ||
      !areArraysEqual(initial.item_types, formState.item_types)
    )
  }, [formState])

  const validateForm = useCallback(() => {
    let valid = true
    if (!formState.name.trim()) {
      nameWarning.showWarning()
      valid = false
    } else {
      nameWarning.hideWarning()
    }
    return valid
  }, [formState.name, nameWarning])

  const buildTypeQuery = useCallback((value: string) => {
    return {
      name: {
        operation: 'ilike',
        value: `%${value}%`,
      },
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    if (!validateForm()) return
    const changedFields = resolveChangedFields(initialSnapshotRef.current, formState)
    if (mode === 'update' && (!changedFields || Object.keys(changedFields).length === 0)) {
      showMessage({ status: 400, message: 'No changes detected.' })
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        const response = await itemService.createItemCategory({
          name: formState.name,
          item_types: formState.item_types,
        })
        const created = responseManager.resolveEntityFromResponse<ItemCategoryDetails>(response.data ?? null)
        const id = (created?.id as number) ?? targetCategory?.id ?? Date.now()
        const entity: ItemCategoryDetails = {
          id,
          name: formState.name,
          item_types: typeOptions
            .filter((type) => formState.item_types.includes(type.id))
            .map((type) => ({ id: type.id, name: type.name })),
        }
        upsertIntoCollection('ItemCategories', entity)
        showMessage({ status: 200, message: 'Item category created.' })
      } else if (targetCategory) {
        const response = await itemService.updateItemCategory({
          id: targetCategory.id,
          fields: changedFields ?? {},
        })
        const updated = responseManager.mergeWithFallback(
          responseManager.resolveEntityFromResponse<ItemCategoryDetails>(response.data ?? null),
          {
            ...targetCategory,
            ...formState,
            item_types: typeOptions
              .filter((type) => formState.item_types.includes(type.id))
              .map((type) => ({ id: type.id, name: type.name })),
          },
        )
        upsertIntoCollection('ItemCategories', updated)
        showMessage({ status: 200, message: 'Item category updated.' })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      console.error(error)
      showMessage({ status: 500, message: 'Failed to save item category.' })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    formState,
    isSubmitting,
    itemService,
    mode,
    onClose,
    responseManager,
    showMessage,
    targetCategory,
    typeOptions,
    upsertIntoCollection,
    validateForm,
  ])

  useEffect(() => {
    if (!registerBeforeClose) return
    if (!hasPendingChanges) {
      registerBeforeClose(undefined)
      return
    }
    registerBeforeClose({
      shouldWarn: () => hasPendingChanges,
      onSave: async () => {
        await handleSubmit()
      },
      message: mode === 'create' ? 'Create this category before closing?' : 'Save changes before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  return (
    <div className="space-y-4">
      <Field label="Category name" warningController={nameWarning}>
        <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>
      <Field label="Description (optional)">
        <InputField
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>
      <SelectItemPropertiesRelationships
        label="Types"
        selectedIds={formState.item_types}
        onChange={(ids) => setFormState((prev) => ({ ...prev, item_types: ids }))}
        loadOptions={async (query) => {
          const response = await itemService.queryItemTypes(query)
          return response.data?.items ?? []
        }}
        buildQuery={(value) => buildTypeQuery(value)}
        filterOptions={[]}
      />
      <div className="pt-2">
        <BasicButton
          params={{
            variant: 'primary',
            onClick: handleSubmit,
            disabled: isSubmitting,
          }}
        >
          {mode === 'create' ? 'Create' : 'Update'}
        </BasicButton>
      </div>
    </div>
  )
}

function createInitialFormState(category: ItemCategoryDetails | null): ItemCategoryFormState {
  return {
    name: category?.name ?? '',
    description: '',
    item_types: category?.item_types?.map((type) => type.id) ?? [],
  }
}

function createSnapshot(state: ItemCategoryFormState): Snapshot {
  return { ...state, item_types: [...state.item_types] }
}

function resolveChangedFields(initial: Snapshot, current: ItemCategoryFormState) {
  const changed: Partial<ItemCategoryFormState> = {}
  if (initial.name !== current.name) changed.name = current.name
  if (!areArraysEqual(initial.item_types, current.item_types)) changed.item_types = current.item_types
  return changed
}

function areArraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((val) => setA.has(val))
}
