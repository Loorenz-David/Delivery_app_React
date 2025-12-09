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
  type ItemPropertyPayload,
  type ItemTypeDetails,
} from '../../api/itemPropertiesService'
import { SelectItemPropertiesRelationships } from '../ui/SelectItemPropertiesRelationships'
import { DropdownOptionsEditor, type DropdownOption } from '../ui/DropdownOptionsEditor'

type FillItemPropertyMode = 'create' | 'update'

export interface FillItemPropertyPayload {
  mode?: FillItemPropertyMode
  itemProperty?: ItemPropertyPayload | null
}

interface ItemPropertyFormState {
  name: string
  field_type: string
  required: boolean
  options?: DropdownOption[]
  item_types: number[]
}

type Snapshot = ItemPropertyFormState

const FIELD_TYPE_OPTIONS = [
  { value: 'text', display: 'Text' },
  { value: 'dropdown', display: 'Dropdown' },
]

export function FillItemProperty({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
}: ActionComponentProps<FillItemPropertyPayload>) {
  const mode: FillItemPropertyMode = payload?.mode ?? (payload?.itemProperty ? 'update' : 'create')
  const targetProperty = payload?.itemProperty ?? null

  const itemService = useMemo(() => new ItemPropertiesService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const settingsDataManager = useResourceManager<DataManager<SettingsDataset>>('settingsDataManager')

  const [formState, setFormState] = useState<ItemPropertyFormState>(() => createInitialFormState(targetProperty))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typeOptions, setTypeOptions] = useState<ItemTypeDetails[]>([])
  const initialSnapshotRef = useRef<Snapshot>(createSnapshot(formState))

  const nameWarning = useInputWarning('Property name is required.')
  const fieldTypeWarning = useInputWarning('Field type is required.')

  const fetchTypes = useCallback(async () => {
    const response = await itemService.queryItemTypes()
    setTypeOptions(response.data?.items ?? [])
  }, [itemService])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  useEffect(() => {
    const nextState = createInitialFormState(targetProperty)
    setFormState(nextState)
    nameWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProperty])

  useEffect(() => {
    if (!setPopupHeader) return
    setPopupHeader(
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Create item property' : `Update ${targetProperty?.name ?? 'item property'}`}
        </span>
      </div>,
    )
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetProperty?.name])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    return (
      initial.name !== formState.name ||
      initial.field_type !== formState.field_type ||
      initial.required !== formState.required ||
      !areArraysEqual(initial.item_types, formState.item_types) ||
      !areOptionsEqual(initial.options ?? [], formState.options ?? [])
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
    if (!formState.field_type.trim()) {
      fieldTypeWarning.showWarning()
      valid = false
    } else {
      fieldTypeWarning.hideWarning()
    }
    return valid
  }, [fieldTypeWarning, formState.field_type, formState.name, nameWarning])

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
      const normalizedOptions = formState.field_type === 'dropdown' ? formState.options : undefined
      if (mode === 'create') {
        const response = await itemService.createItemProperty({
          name: formState.name,
          field_type: formState.field_type,
          required: formState.required,
          options: normalizedOptions,
          item_types: formState.item_types,
        })
        const created = responseManager.resolveEntityFromResponse<ItemPropertyPayload>(response.data ?? null)
        const id = (created?.id as number) ?? targetProperty?.id ?? Date.now()
        const entity: ItemPropertyPayload = {
          id,
          name: formState.name,
          field_type: formState.field_type,
          required: formState.required,
          options: normalizedOptions,
          item_types: typeOptions
            .filter((type) => formState.item_types.includes(type.id))
            .map((type) => ({ id: type.id, name: type.name })),
        }
        upsertCollection(settingsDataManager, 'ItemSubProperties', entity)
        showMessage({ status: 200, message: 'Item property created.' })
      } else if (targetProperty) {
        const response = await itemService.updateItemProperty({
          id: targetProperty.id,
          fields: {
            ...changedFields,
            options: normalizedOptions,
          },
        })
        const updated = responseManager.mergeWithFallback(
          responseManager.resolveEntityFromResponse<ItemPropertyPayload>(response.data ?? null),
          {
            ...targetProperty,
            ...formState,
            options: normalizedOptions,
            item_types: typeOptions
              .filter((type) => formState.item_types.includes(type.id))
              .map((type) => ({ id: type.id, name: type.name })),
          },
        )
        upsertCollection(settingsDataManager, 'ItemSubProperties', updated)
        showMessage({ status: 200, message: 'Item property updated.' })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      console.error(error)
      showMessage({ status: 500, message: 'Failed to save item property.' })
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
    settingsDataManager,
    showMessage,
    targetProperty,
    typeOptions,
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
      message: mode === 'create' ? 'Create this property before closing?' : 'Save changes before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  const categoryFilters = useMemo(() => {
    const labels = new Set<string>()
    typeOptions.forEach((type) => {
      const categoryName = (type as any)?.item_category?.name ?? ''
      if (categoryName) labels.add(categoryName)
    })
    return Array.from(labels).map((label) => ({ value: label, label }))
  }, [typeOptions])

  return (
    <div className="space-y-4">
      <Field label="Property name" warningController={nameWarning}>
        <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>
      <Field label="Field type" warningController={fieldTypeWarning}>
        <DropDown
          options={FIELD_TYPE_OPTIONS}
          className="w-full"
          state={[
            formState.field_type,
            (value) =>
              setFormState((prev) => ({
                ...prev,
                field_type: String(value),
                options: String(value) === 'dropdown' ? prev.options ?? [] : undefined,
              })),
          ]}
        />
      </Field>
      <Field label="Required">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={formState.required}
            onChange={(event) => setFormState((prev) => ({ ...prev, required: event.target.checked }))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          This property is required
        </label>
      </Field>
      {formState.field_type === 'dropdown' ? (
        <DropdownOptionsEditor value={formState.options ?? []} onChange={(opts) => setFormState((prev) => ({ ...prev, options: opts }))} />
      ) : null}
      <SelectItemPropertiesRelationships
        label="Types"
        selectedIds={formState.item_types}
        onChange={(ids) => setFormState((prev) => ({ ...prev, item_types: ids }))}
        loadOptions={async (query) => {
          const response = await itemService.queryItemTypes(query)
          return response.data?.items ?? []
        }}
        filterOptions={[{ value: 'name', label: 'Type name' }, ...categoryFilters]}
        buildQuery={(value, filter) => {
          if (filter === 'name') return buildTypeQuery(value)
          return {
            name: {
              operation: 'ilike',
              value: `%${value}%`,
            },
          }
        }}
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

function createInitialFormState(property: ItemPropertyPayload | null): ItemPropertyFormState {
  return {
    name: property?.name ?? '',
    field_type: property?.field_type ?? 'text',
    required: property?.required ?? false,
    options: (property?.options as DropdownOption[] | undefined) ?? [],
    item_types: property?.item_types?.map((type) => type.id) ?? [],
  }
}

function createSnapshot(state: ItemPropertyFormState): Snapshot {
  return { ...state, item_types: [...state.item_types], options: state.options ? [...state.options] : [] }
}

function resolveChangedFields(initial: Snapshot, current: ItemPropertyFormState) {
  const changed: Partial<ItemPropertyFormState> = {}
  if (initial.name !== current.name) changed.name = current.name
  if (initial.field_type !== current.field_type) changed.field_type = current.field_type
  if (initial.required !== current.required) changed.required = current.required
  if (!areArraysEqual(initial.item_types, current.item_types)) changed.item_types = current.item_types
  if (!areOptionsEqual(initial.options ?? [], current.options ?? [])) changed.options = current.options
  return changed
}

function areArraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((val) => setA.has(val))
}

function areOptionsEqual(a: DropdownOption[], b: DropdownOption[]) {
  if (a.length !== b.length) return false
  return a.every((opt, index) => opt.display === b[index].display && opt.value === b[index].value)
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
