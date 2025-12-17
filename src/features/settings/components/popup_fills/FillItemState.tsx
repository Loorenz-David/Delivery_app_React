import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ItemPropertiesService, type ItemStateDetails } from '../../api/itemPropertiesService'
import { useSettingsStore } from '../../../../store/settings/useSettingsStore'

type FillItemStateMode = 'create' | 'update'

export interface FillItemStatePayload {
  mode?: FillItemStateMode
  itemState?: ItemStateDetails | null
}

interface ItemStateFormState {
  name: string
  description: string
  priority: string
  color: string
  default: boolean
}

type Snapshot = ItemStateFormState

export function FillItemState({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
}: ActionComponentProps<FillItemStatePayload>) {
  const mode: FillItemStateMode = payload?.mode ?? (payload?.itemState ? 'update' : 'create')
  const targetState = payload?.itemState ?? null

  const itemService = useMemo(() => new ItemPropertiesService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const upsertIntoCollection = useSettingsStore((state) => state.upsertIntoCollection)

  const [formState, setFormState] = useState<ItemStateFormState>(() => createInitialFormState(targetState))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialSnapshotRef = useRef<Snapshot>(createSnapshot(formState))

  const nameWarning = useInputWarning('State name is required.')
  const descriptionWarning = useInputWarning('Description is required.')
  const colorWarning = useInputWarning('Color is required.')
  const priorityWarning = useInputWarning('Priority is required.')

  useEffect(() => {
    const nextState = createInitialFormState(targetState)
    setFormState(nextState)
    nameWarning.hideWarning()
    descriptionWarning.hideWarning()
    colorWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetState])

  useEffect(() => {
    if (!setPopupHeader) return
    setPopupHeader(
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Create item state' : `Update ${targetState?.name ?? 'item state'}`}
        </span>
      </div>,
    )
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetState?.name])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    return (
      initial.name !== formState.name ||
      initial.description !== formState.description ||
      initial.priority !== formState.priority ||
      initial.color !== formState.color ||
      initial.default !== formState.default
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
    if (!formState.description.trim()) {
      descriptionWarning.showWarning()
      valid = false
    } else {
      descriptionWarning.hideWarning()
    }
    if (!formState.color.trim()) {
      colorWarning.showWarning()
      valid = false
    } else {
      colorWarning.hideWarning()
    }
    if (!formState.priority.trim()) {
      priorityWarning.showWarning()
      valid = false
    } else {
      priorityWarning.hideWarning()
    }
    return valid
  }, [colorWarning, descriptionWarning, formState.color, formState.description, formState.name, formState.priority, nameWarning, priorityWarning])

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
        const response = await itemService.createItemState({
          name: formState.name,
          description: formState.description,
          priority: Number(formState.priority),
          color: formState.color,
          default: formState.default,
        })
        const created = responseManager.resolveEntityFromResponse<ItemStateDetails>(response.data ?? null)
        const entity: ItemStateDetails = {
          id: (created?.id as number) ?? targetState?.id ?? Date.now(),
          name: formState.name,
          description: formState.description,
          priority: Number(formState.priority),
          color: formState.color,
          default: formState.default,
        }
        upsertIntoCollection('ItemStates', entity)
        showMessage({ status: 200, message: 'Item state created.' })
      } else if (targetState) {
        const response = await itemService.updateItemState({
          id: targetState.id,
          fields: {
            ...changedFields,
            priority: changedFields?.priority != null ? Number(changedFields.priority) : undefined,
          },
        })
        const updated = responseManager.mergeWithFallback(
          responseManager.resolveEntityFromResponse<ItemStateDetails>(response.data ?? null),
          { ...targetState, ...formState, priority: Number(formState.priority) },
        )
        upsertIntoCollection('ItemStates', updated)
        showMessage({ status: 200, message: 'Item state updated.' })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      console.error(error)
      showMessage({ status: 500, message: 'Failed to save item state.' })
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
    targetState,
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
      message: mode === 'create' ? 'Create this state before closing?' : 'Save changes before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  return (
    <div className="space-y-4">
      <Field label="State name" warningController={nameWarning}>
        <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>
      <Field label="Description" warningController={descriptionWarning}>
        <InputField
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>
      <Field label="Priority" warningController={priorityWarning}>
        <InputField
          type="number"
          value={formState.priority}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              priority: event.target.value,
            }))
          }
        />
      </Field>
      <Field label="Color" warningController={colorWarning}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Pick color"
            value={formState.color || '#1e90ff'}
            onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
            className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-white"
          />
          <InputField
            value={formState.color}
            onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
          />
        </div>
      </Field>
      <Field label="Default state">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={formState.default}
            onChange={(event) => setFormState((prev) => ({ ...prev, default: event.target.checked }))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span>Set as default</span>
        </div>
      </Field>
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

function createInitialFormState(state: ItemStateDetails | null): ItemStateFormState {
  return {
    name: state?.name ?? '',
    description: (state as ItemStateDetails | null)?.description ?? '',
    priority: (state as ItemStateDetails | null)?.priority?.toString() ?? '',
    color: state?.color ?? '#1e90ff',
    default: state?.default ?? false,
  }
}

function createSnapshot(state: ItemStateFormState): Snapshot {
  return { ...state }
}

function resolveChangedFields(initial: Snapshot, current: ItemStateFormState) {
  const changed: Partial<ItemStateFormState> = {}
  if (initial.name !== current.name) changed.name = current.name
  if (initial.description !== current.description) changed.description = current.description
  if (initial.priority !== current.priority) changed.priority = current.priority
  if (initial.color !== current.color) changed.color = current.color
  if (initial.default !== current.default) changed.default = current.default
  return changed
}
