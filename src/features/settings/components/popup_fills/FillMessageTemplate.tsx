import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { TextAreaField } from '../../../../components/forms/TextAreaField'
import { DropDown } from '../../../../components/buttons/DropDown'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { MessageTemplateService } from '../../api/messageTemplateService'
import type { SettingsDataset, SettingsMessageTemplate } from '../../types'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import type { CreateMessageTemplatePayload } from '../../api/messageTemplateService'
import { ApiError } from '../../../../lib/api/ApiClient'
import { useSettingsStore, type SettingsDatasetUpdater } from '../../../../store/settings/useSettingsStore'

type FillMessageTemplateMode = 'create' | 'edit'

export interface FillMessageTemplatePayload extends Record<string, unknown> {
  mode?: FillMessageTemplateMode
  template?: SettingsMessageTemplate | null
}

interface TemplateFormState {
  name: string
  channel: 'email' | 'sms'
  content: string
}

type TemplateSnapshot = TemplateFormState

const CHANNEL_OPTIONS: Array<{ value: 'email' | 'sms'; display: string }> = [
  { value: 'email', display: 'Email' },
  { value: 'sms', display: 'SMS' },
] as const

const PLACEHOLDER_TOKENS = [
  { label: 'Client first name', value: 'client_first_name' },
  { label: 'Client last name', value: 'client_last_name' },
  { label: 'Expected arrival time', value: 'expected_arrival_time' },
  { label: 'Arrival time range', value: 'arrival_time_range' },
  { label: 'Client address', value: 'client_address[raw_address]' },
  { label: 'Primary phone', value: 'client_primary_phone[number]' },
  { label: 'Secondary phone', value: 'client_secondary_phone[number]' },
  { label: 'Client email', value: 'client_email' },
]

export function FillMessageTemplate({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
  setIsLoading,
}: ActionComponentProps<FillMessageTemplatePayload>) {
  const mode: FillMessageTemplateMode = payload?.mode ?? (payload?.template ? 'edit' : 'create')
  const targetTemplate = payload?.template ?? null

  const templateService = useMemo(() => new MessageTemplateService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const updateDataset = useSettingsStore((state) => state.updateDataset)

  const [formState, setFormState] = useState<TemplateFormState>(() => createInitialState(targetTemplate))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialSnapshotRef = useRef<TemplateSnapshot>(createSnapshot(formState))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const nameWarning = useInputWarning('Subject is required.')
  const contentWarning = useInputWarning('Content is required.')

  useEffect(() => {
    const nextState = createInitialState(targetTemplate)
    setFormState(nextState)
    nameWarning.hideWarning()
    contentWarning.hideWarning()
    initialSnapshotRef.current = createSnapshot(nextState)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTemplate])

  useEffect(() => {
    if (!setPopupHeader) {
      return
    }
    setPopupHeader(<FillMessageTemplateHeader mode={mode} templateName={targetTemplate?.name} />)
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetTemplate?.name])

  const hasPendingChanges = useMemo(() => {
    const snapshot = initialSnapshotRef.current
    return snapshot.name !== formState.name || snapshot.channel !== formState.channel || snapshot.content !== formState.content
  }, [formState])

  const validateForm = useCallback(() => {
    let isValid = true
    if (!formState.name.trim()) {
      nameWarning.showWarning()
      isValid = false
    } else {
      nameWarning.hideWarning()
    }
    if (!formState.content.trim()) {
      contentWarning.showWarning()
      isValid = false
    } else {
      contentWarning.hideWarning()
    }
    return isValid
  }, [contentWarning, formState.content, formState.name, nameWarning])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return
    }
    if (!validateForm()) {
      return
    }

    const changedFields = resolveChangedFields(initialSnapshotRef.current, formState)

    if (mode === 'edit' && (!changedFields || Object.keys(changedFields).length === 0)) {
      showMessage({ status: 400, message: 'No changes detected.' })
      return
    }

    setIsLoading(true)
    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        await handleCreateTemplate(formState, {
          templateService,
          responseManager,
          updateDataset,
          showMessage,
        })
      } else if (targetTemplate) {
        await handleUpdateTemplate({
          templateService,
          responseManager,
          updateDataset,
          showMessage,
          templateId: targetTemplate.id,
          fallbackTemplate: targetTemplate,
          changedFields: changedFields ?? {},
        })
      }
      initialSnapshotRef.current = createSnapshot(formState)
      onClose()
    } catch (error) {
      handleRequestError(error, showMessage)
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [
    formState,
    isSubmitting,
    mode,
    onClose,
    responseManager,
    setIsLoading,
    showMessage,
    targetTemplate,
    templateService,
    updateDataset,
    validateForm,
  ])

  useEffect(() => {
    if (!registerBeforeClose) {
      return
    }
    if (!hasPendingChanges) {
      registerBeforeClose(undefined)
      return
    }
    registerBeforeClose({
      shouldWarn: () => hasPendingChanges,
      onSave: async () => {
        await handleSubmit()
      },
      message: 'You have unsaved changes. Save before closing?',
      saveLabel: mode === 'create' ? 'Create' : 'Update',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, mode, registerBeforeClose])

  const insertToken = useCallback((token: string) => {
    const insertion = `{${token}}`
    const textarea = textareaRef.current
    if (!textarea) {
      setFormState((prev) => ({ ...prev, content: prev.content + insertion }))
      return
    }
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? start
    setFormState((prev) => {
      const nextContent = prev.content.slice(0, start) + insertion + prev.content.slice(end)
      requestAnimationFrame(() => {
        textarea.focus()
        const caret = start + insertion.length
        textarea.setSelectionRange(caret, caret)
      })
      return { ...prev, content: nextContent }
    })
  }, [])

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-4">
        <Field label="Subject" required warning={nameWarning.warning}>
          <InputField value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} warningController={nameWarning} />
        </Field>

        <Field label="Channel" required>
          <DropDown
            options={CHANNEL_OPTIONS}
            className="max-w-xs"
            state={[formState.channel, (value) => setFormState((prev) => ({ ...prev, channel: value as 'email' | 'sms' }))]}
          />
        </Field>

        <Field label="Content" required warning={contentWarning.warning}>
          <TextAreaField
            value={formState.content}
            onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
            warningController={contentWarning}
            textareaRef={textareaRef}
            placeholder="Write your message template..."
          />
        </Field>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Custom labels</p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDER_TOKENS.map((token) => (
              <button
                key={token.value}
                type="button"
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                onClick={() => insertToken(token.value)}
              >
                {token.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <BasicButton
          params={{
            variant: 'primary',
            type: 'submit',
            disabled: isSubmitting,
          }}
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create template' : 'Update template'}
        </BasicButton>
      </div>
    </form>
  )
}

function FillMessageTemplateHeader({ mode, templateName }: { mode: FillMessageTemplateMode; templateName?: string }) {
  const title = mode === 'create' ? 'Create message template' : `Edit ${templateName ?? 'template'}`
  const description =
    mode === 'create'
      ? 'Compose a new message template for your campaigns.'
      : 'Update content and channels to keep messaging relevant.'
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
      <span className="text-xs text-[var(--color-muted)]">{description}</span>
    </div>
  )
}

function createInitialState(template?: SettingsMessageTemplate | null): TemplateFormState {
  return {
    name: template?.name ?? '',
    channel: template?.channel ?? 'email',
    content: template?.content ?? '',
  }
}

function createSnapshot(state: TemplateFormState): TemplateSnapshot {
  return { ...state }
}

function resolveChangedFields(snapshot: TemplateSnapshot, state: TemplateFormState): Partial<CreateMessageTemplatePayload> | null {
  const changes: Partial<CreateMessageTemplatePayload> = {}
  if (snapshot.name !== state.name) {
    changes.name = state.name
  }
  if (snapshot.channel !== state.channel) {
    changes.channel = state.channel
  }
  if (snapshot.content !== state.content) {
    changes.content = state.content
  }
  return Object.keys(changes).length > 0 ? changes : null
}

async function handleCreateTemplate(
  formState: TemplateFormState,
  context: {
    templateService: MessageTemplateService
    responseManager: ResponseManager
    updateDataset: SettingsDatasetUpdater
    showMessage: (payload: { status: number; message: string }) => void
  },
) {
  const { templateService, responseManager, updateDataset, showMessage } = context
  const response = await templateService.createTemplate({
    name: formState.name,
    content: formState.content,
    channel: formState.channel,
  })
  const resolved = responseManager.resolveEntityFromResponse<SettingsMessageTemplate>(response.data)
  const fallback: SettingsMessageTemplate = {
    id: resolved?.id ?? Date.now(),
    name: formState.name,
    content: formState.content,
    channel: formState.channel,
  }
  const merged = responseManager.mergeWithFallback(resolved, fallback)
  persistTemplate(updateDataset, merged)
  showMessage({
    status: response.status ?? 200,
    message: response.message ?? 'Message template created successfully.',
  })
}

async function handleUpdateTemplate(options: {
  templateService: MessageTemplateService
  responseManager: ResponseManager
  updateDataset: SettingsDatasetUpdater
  showMessage: (payload: { status: number; message: string }) => void
  templateId: number
  fallbackTemplate: SettingsMessageTemplate
  changedFields: Partial<CreateMessageTemplatePayload>
}) {
  const { templateService, responseManager, updateDataset, showMessage, templateId, fallbackTemplate, changedFields } = options
  const sanitized = responseManager.sanitizePayload(changedFields)
  const response = await templateService.updateTemplate({
    id: templateId,
    fields: sanitized,
  })
  const resolved = responseManager.resolveEntityFromResponse<SettingsMessageTemplate>(response.data)
  const fallback: SettingsMessageTemplate = {
    ...fallbackTemplate,
    ...changedFields,
  }
  const merged = responseManager.mergeWithFallback(resolved, fallback)
  persistTemplate(updateDataset, merged)
  showMessage({
    status: response.status ?? 200,
    message: response.message ?? 'Message template updated successfully.',
  })
}

function persistTemplate(updateDataset: SettingsDatasetUpdater, template: SettingsMessageTemplate) {
  updateDataset((prev) => {
    const base: SettingsDataset = prev ?? { UserInfo: null, UsersList: null, MessageTemplates: [] }
    const list = Array.isArray(base.MessageTemplates) ? [...base.MessageTemplates] : []
    const index = list.findIndex((candidate) => candidate.id === template.id)
    if (index >= 0) {
      list[index] = template
    } else {
      list.unshift(template)
    }
    return {
      ...base,
      MessageTemplates: list,
    }
  })
}

function handleRequestError(error: unknown, showMessage: (payload: { status: number; message: string }) => void) {
  const status = error instanceof ApiError ? error.status ?? 500 : 500
  const message =
    error instanceof ApiError && error.message ? error.message : 'Unable to save the message template. Please try again.'
  showMessage({ status, message })
}
