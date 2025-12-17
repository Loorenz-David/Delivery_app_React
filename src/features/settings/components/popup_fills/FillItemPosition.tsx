import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ItemPropertiesService, type ItemPositionDetails } from '../../api/itemPropertiesService'
import { useSettingsStore } from '../../../../store/settings/useSettingsStore'

type FillItemPositionMode = 'create' | 'update'

export interface FillItemPositionPayload {
  mode?: FillItemPositionMode
  itemPosition?: ItemPositionDetails | null
}

interface ItemPositionFormState {
  name: string
  description: string
  default: boolean
}

type Snapshot = ItemPositionFormState

export function FillItemPosition({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
}: ActionComponentProps<FillItemPositionPayload>) {
  const mode: FillItemPositionMode = payload?.mode ?? (payload?.itemPosition ? 'update' : 'create')
  const targetPosition = payload?.itemPosition ?? null

  const itemService = useMemo(() => new ItemPropertiesService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const upsertIntoCollection = useSettingsStore((state) => state.upsertIntoCollection)

  const [formState, setFormState] = useState<ItemPositionFormState>(() => createInitialFormState(targetPosition))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialSnapshotRef = useRef<Snapshot>(createSnapshot(formState))

  const nameWarning = useInputWarning('Position name is required.')
  const descriptionWarning = useInputWarning('Description is required.')

  useEffect(() => {
    const nextState = createInitialFormState(targetPosition)
    setFormState(nextState)
    nameWarning.hideWarning()
    descriptionWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPosition])

  useEffect(() => {
    if (!setPopupHeader) return
    setPopupHeader(
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Create item position' : `Update ${targetPosition?.name ?? 'item position'}`}
        </span>
      </div>,
    )
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetPosition?.name])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    return (
      initial.name !== formState.name ||
      initial.description !== formState.description ||
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
    return valid
  }, [descriptionWarning, formState.description, formState.name, nameWarning])

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
        const response = await itemService.createItemPosition({
          name: formState.name,
          description: formState.description,
          default: formState.default,
        })
        const created = responseManager.resolveEntityFromResponse<ItemPositionDetails>(response.data ?? null)
        const entity: ItemPositionDetails = {
          id: (created?.id as number) ?? targetPosition?.id ?? Date.now(),
          name: formState.name,
          description: formState.description,
          default: formState.default,
        }
        upsertIntoCollection('ItemPositions', entity)
        showMessage({ status: 200, message: 'Item position created.' })
      } else if (targetPosition) {
        const response = await itemService.updateItemPosition({
          id: targetPosition.id,
          fields: changedFields ?? {},
        })
        const updated = responseManager.mergeWithFallback(
          responseManager.resolveEntityFromResponse<ItemPositionDetails>(response.data ?? null),
          { ...targetPosition, ...formState },
        )
        upsertIntoCollection('ItemPositions', updated)
        showMessage({ status: 200, message: 'Item position updated.' })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      console.error(error)
      showMessage({ status: 500, message: 'Failed to save item position.' })
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
    targetPosition,
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
      message: mode === 'create' ? 'Create this position before closing?' : 'Save changes before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  return (
    <div className="space-y-4">
      <Field label="Position name" warningController={nameWarning}>
        <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>
      <Field label="Description" warningController={descriptionWarning}>
        <InputField
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>
      <Field label="Default position">
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

function createInitialFormState(position: ItemPositionDetails | null): ItemPositionFormState {
  return {
    name: position?.name ?? '',
    description: position?.description ?? '',
    default: position?.default ?? false,
  }
}

function createSnapshot(state: ItemPositionFormState): Snapshot {
  return { ...state }
}

function resolveChangedFields(initial: Snapshot, current: ItemPositionFormState) {
  const changed: Partial<ItemPositionFormState> = {}
  if (initial.name !== current.name) changed.name = current.name
  if (initial.description !== current.description) changed.description = current.description
  if (initial.default !== current.default) changed.default = current.default
  return changed
}
