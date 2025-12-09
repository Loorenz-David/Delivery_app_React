import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { DropDown } from '../../../../components/buttons/DropDown'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import type { DataManager } from '../../../../resources_manager/managers/DataManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import type { SettingsDataset } from '../../types'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import {
  ItemPropertiesService,
  type ItemCategoryDetails,
  type ItemPropertyPayload,
  type ItemTypeDetails,
} from '../../api/itemPropertiesService'
import { SelectItemPropertiesRelationships } from '../ui/SelectItemPropertiesRelationships'

type FillItemTypeMode = 'create' | 'update'

export interface FillItemTypePayload {
  mode?: FillItemTypeMode
  itemType?: ItemTypeDetails | null
}

interface ItemTypeFormState {
  name: string
  description: string
  item_category_id: number | null
  properties: number[]
}

type Snapshot = ItemTypeFormState

const PROPERTY_FILTER_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'field_type', label: 'Field type' },
]

export function FillItemType({ payload, onClose, setPopupHeader, registerBeforeClose }: ActionComponentProps<FillItemTypePayload>) {
  const mode: FillItemTypeMode = payload?.mode ?? (payload?.itemType ? 'update' : 'create')
  const targetType = payload?.itemType ?? null

  const itemService = useMemo(() => new ItemPropertiesService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const settingsDataManager = useResourceManager<DataManager<SettingsDataset>>('settingsDataManager')

  const [formState, setFormState] = useState<ItemTypeFormState>(() => createInitialFormState(targetType))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<ItemCategoryDetails[]>([])
  const [propertyOptions, setPropertyOptions] = useState<ItemPropertyPayload[]>([])
  const initialSnapshotRef = useRef<Snapshot>(createSnapshot(formState))

  const nameWarning = useInputWarning('Type name is required.')

  const fetchCategories = useCallback(async () => {
    const response = await itemService.queryItemCategories()
    setCategoryOptions(response.data?.items ?? [])
  }, [itemService])

  const fetchProperties = useCallback(async () => {
    const response = await itemService.queryItemProperties()
    setPropertyOptions(response.data?.items ?? [])
  }, [itemService])

  useEffect(() => {
    fetchCategories()
    fetchProperties()
  }, [fetchCategories, fetchProperties])

  useEffect(() => {
    const nextState = createInitialFormState(targetType)
    setFormState(nextState)
    nameWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType])

  useEffect(() => {
    if (!setPopupHeader) return
    setPopupHeader(
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Create item type' : `Update ${targetType?.name ?? 'item type'}`}
        </span>
      </div>,
    )
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetType?.name])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    return (
      initial.name !== formState.name ||
      initial.item_category_id !== formState.item_category_id ||
      !areArraysEqual(initial.properties, formState.properties)
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

  const buildPropertyQuery = useCallback((value: string, filter: string) => {
    return {
      [filter]: {
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
        const response = await itemService.createItemType({
          name: formState.name,
          item_category_id: formState.item_category_id ?? undefined,
          properties: formState.properties,
        })
        const created = responseManager.resolveEntityFromResponse<ItemTypeDetails>(response.data ?? null)
        const id = (created?.id as number) ?? targetType?.id ?? Date.now()
        const entity: ItemTypeDetails = {
          id,
          name: formState.name,
          item_category_id: formState.item_category_id ?? undefined,
          item_category: categoryOptions.find((c) => c.id === formState.item_category_id),
          properties: propertyOptions.filter((prop) => formState.properties.includes(prop.id)),
        }
        upsertCollection(settingsDataManager, 'ItemTypes', entity)
        showMessage({ status: 200, message: 'Item type created.' })
      } else if (targetType) {
        const response = await itemService.updateItemType({
          id: targetType.id,
          fields: changedFields ?? {},
        })
        const updated = responseManager.mergeWithFallback(
          responseManager.resolveEntityFromResponse<ItemTypeDetails>(response.data ?? null),
          {
            ...targetType,
            ...formState,
            item_category: categoryOptions.find((c) => c.id === formState.item_category_id) ?? targetType.item_category,
            properties: propertyOptions.filter((prop) => formState.properties.includes(prop.id)),
          },
        )
        upsertCollection(settingsDataManager, 'ItemTypes', updated)
        showMessage({ status: 200, message: 'Item type updated.' })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      console.error(error)
      showMessage({ status: 500, message: 'Failed to save item type.' })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    categoryOptions,
    formState,
    isSubmitting,
    itemService,
    mode,
    onClose,
    propertyOptions,
    responseManager,
    settingsDataManager,
    showMessage,
    targetType,
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
      message: mode === 'create' ? 'Create this type before closing?' : 'Save changes before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  return (
    <div className="space-y-4">
      <Field label="Type name" warningController={nameWarning}>
        <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>
      <Field label="Description (optional)">
        <InputField
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>
      <Field label="Category">
        <DropDown
          options={[
            { value: '', display: 'Unassigned' },
            ...categoryOptions.map((category) => ({ value: category.id, display: category.name })),
          ]}
          className="w-full"
          state={[
            formState.item_category_id ?? '',
            (value) =>
              setFormState((prev) => ({
                ...prev,
                item_category_id: value === '' ? null : Number(value),
              })),
          ]}
        />
      </Field>
      <SelectItemPropertiesRelationships
        label="Properties"
        selectedIds={formState.properties}
        onChange={(ids) => setFormState((prev) => ({ ...prev, properties: ids }))}
        loadOptions={async (query) => {
          const response = await itemService.queryItemProperties(query)
          return response.data?.items ?? []
        }}
        filterOptions={PROPERTY_FILTER_OPTIONS}
        buildQuery={buildPropertyQuery}
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

function createInitialFormState(itemType: ItemTypeDetails | null): ItemTypeFormState {
  return {
    name: itemType?.name ?? '',
    description: '',
    item_category_id: (itemType?.item_category_id as number | undefined) ?? null,
    properties: itemType?.properties?.map((prop) => prop.id) ?? [],
  }
}

function createSnapshot(state: ItemTypeFormState): Snapshot {
  return { ...state, properties: [...state.properties] }
}

function resolveChangedFields(initial: Snapshot, current: ItemTypeFormState) {
  const changed: Partial<ItemTypeFormState> = {}
  if (initial.name !== current.name) changed.name = current.name
  if (initial.item_category_id !== current.item_category_id) changed.item_category_id = current.item_category_id ?? undefined
  if (!areArraysEqual(initial.properties, current.properties)) changed.properties = current.properties
  return changed
}

function areArraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((val) => setA.has(val))
}

function upsertCollection<T extends { id: number }>(
  manager: DataManager<SettingsDataset>,
  key: keyof SettingsDataset | string,
  entity: T,
) {
  manager.updateDataset((dataset) => {
    const next = { ...(dataset ?? {}) } as Record<string, unknown>
    const collection = Array.isArray(next[key as string]) ? ([...(next[key as string] as unknown[])] as T[]) : []
    const index = collection.findIndex((item) => item.id === entity.id)
    if (index >= 0) {
      collection[index] = entity
    } else {
      collection.push(entity)
    }
    next[key as string] = collection
    return next as SettingsDataset
  })
}
