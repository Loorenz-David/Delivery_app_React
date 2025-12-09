import { useCallback, useEffect, useMemo, useState } from 'react'

import { MessageCard } from '../section_cards/MessageCard'
import type { SettingsMessageTemplate } from '../../types'
import { MessageTemplateService } from '../../api/messageTemplateService'
import { SectionPanel } from './SectionPanel'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { NotificationChannelService, type ChannelStatusResponse, type SmtpPayload, type TwilioPayload } from '../../api/notificationChannelService'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { ChevronDownIcon } from '../../../../assets/icons'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'

export function MessageSectionPanel() {
  const templateService = useMemo(() => new MessageTemplateService(), [])
  const channelService = useMemo(() => new NotificationChannelService(), [])
  const { showMessage } = useMessageManager()
  const [activeTab, setActiveTab] = useState<'templates' | 'channels'>('templates')
  const [serviceStatus, setServiceStatus] = useState<ChannelStatusResponse | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const popupManager = useResourceManager('settingsPopupManager')

  const services = useMemo(
    () => ({
      queryAllService: () => templateService.fetchTemplates({ query: {} }),
      queryByInputService: (payload: { query: Record<string, unknown> }) => templateService.fetchTemplates(payload),
    }),
    [templateService],
  )

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All channels' },
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
    ],
    [],
  )

  const buildQuery = useCallback((value: string, channel: string) => {
    const query: Record<string, unknown> = {
      'or-message': {
        name: {
          operation: 'ilike',
          value: `%${value}%`,
        },
        content: {
          operation: 'ilike',
          value: `%${value}%`,
        },
      },
    }
    if (channel !== 'all') {
      query.channel = {
        operation: '==',
        value: channel,
      }
    }
    return { query }
  }, [])

  const refreshStatus = useCallback(async () => {
    setIsLoadingStatus(true)
    try {
      const response = await channelService.areServicesActive()
      setServiceStatus(response.data)
    } catch (error) {
      console.error('Failed to load channel status', error)
      showMessage({ status: 500, message: 'Unable to load channel configuration status.' })
    } finally {
      setIsLoadingStatus(false)
    }
  }, [channelService, showMessage])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const channelContent = (
    <ChannelConfiguration
      status={serviceStatus}
      isLoading={isLoadingStatus}
      onRefresh={refreshStatus}
      channelService={channelService}
    />
  )

  const templatesContent = (
    <SectionPanel<SettingsMessageTemplate, { query: Record<string, unknown> }>
      eyebrow="Message templates"
      title="Engage your customers"
      description="Create automated SMS or email templates for faster outreach."
      dataManagerKey="MessageTemplates"
      createButtonLabel="Create message"
      services={services}
      searchFilterOptions={filterOptions}
      defaultSearchFilter="all"
      searchBuildQuery={buildQuery}
      searchPlaceholder="Search by name or content"
      emptyStateMessage="No message templates found."
      loadingStateMessage="Loading templates..."
      counterLabel={(count) => `${count} templates`}
      getItemKey={(template) => template.id}
      onCreate={() =>
        popupManager.open({
          key: 'FillMessageTemplate',
          payload: { mode: 'create' },
        })
      }
      renderObjectCard={(template) => (
        <MessageCard
          template={template}
          onEdit={(candidate) =>
            popupManager.open({
              key: 'FillMessageTemplate',
              payload: { mode: 'edit', template: candidate },
            })
          }
        />
      )}
    />
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-2">
        <TabButton
          active={activeTab === 'templates'}
          label="Templates"
          onClick={() => setActiveTab('templates')}
        />
        <TabButton
          active={activeTab === 'channels'}
          label="Channel configuration"
          onClick={() => setActiveTab('channels')}
        />
      </div>
      {activeTab === 'templates' ? templatesContent : channelContent}
    </div>
  )
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  )
}

function ChannelConfiguration({
  status,
  isLoading,
  onRefresh,
  channelService,
}: {
  status: ChannelStatusResponse | null
  isLoading: boolean
  onRefresh: () => void
  channelService: NotificationChannelService
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">Notification channels</p>
        <p className="text-xs text-[var(--color-muted)]">
          Configure SMTP and Twilio so your templates can be delivered on email and SMS.
        </p>
      </div>

      <ServiceCard
        title="SMTP (Email)"
        active={Boolean(status?.smtp)}
        isLoading={isLoading}
        defaultOpen={!status?.smtp}
        onSubmit={async (payload) => {
          await channelService.upsertSmtp(payload as SmtpPayload)
          onRefresh()
        }}
        fields="smtp"
      />

      <ServiceCard
        title="Twilio (SMS)"
        active={Boolean(status?.twilio)}
        isLoading={isLoading}
        defaultOpen={!status?.twilio}
        onSubmit={async (payload) => {
          await channelService.upsertTwilio(payload as TwilioPayload)
          onRefresh()
        }}
        fields="twilio"
      />
    </div>
  )
}

type ServiceFields = 'smtp' | 'twilio'

function ServiceCard({
  title,
  active,
  defaultOpen,
  onSubmit,
  fields,
  isLoading,
}: {
  title: string
  active: boolean
  defaultOpen: boolean
  onSubmit: (payload: SmtpPayload | TwilioPayload) => Promise<void>
  fields: ServiceFields
  isLoading: boolean
}) {
  const { showMessage } = useMessageManager()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [smtpState, setSmtpState] = useState<SmtpPayload>({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password_encrypted: '',
    use_tls: true,
    use_ssl: false,
    max_per_session: 50,
  })

  const [twilioState, setTwilioState] = useState<TwilioPayload>({
    twilio_sid: '',
    twilio_token: '',
    sender_number: '',
  })

  const validate = (): boolean => {
    if (fields === 'smtp') {
      return Boolean(
        smtpState.smtp_server &&
          smtpState.smtp_username &&
          smtpState.smtp_password_encrypted &&
          Number.isFinite(Number(smtpState.smtp_port)),
      )
    }
    return Boolean(twilioState.twilio_sid && twilioState.twilio_token && twilioState.sender_number)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    if (!validate()) {
      showMessage({ status: 400, message: 'Please fill all required fields.' })
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(fields === 'smtp' ? smtpState : twilioState)
      showMessage({ status: 'success', message: `${title} saved successfully.` })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to save service', error)
      showMessage({ status: 500, message: `Failed to save ${title}.` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const label = active ? 'Update' : 'Create'

  useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          {active ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
              Active
            </span>
          ) : null}
        </div>
        <ChevronDownIcon
          className={`app-icon h-4 w-4 text-[var(--color-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          {fields === 'smtp' ? (
            <SmtpForm state={smtpState} onChange={setSmtpState} />
          ) : (
            <TwilioForm state={twilioState} onChange={setTwilioState} />
          )}
          <div className="flex justify-end">
            <BasicButton
              params={{
                variant: 'primary',
                className: '',
                onClick: handleSubmit,
                disabled: isSubmitting,
              }}
            >
              {isSubmitting ? 'Saving...' : label}
            </BasicButton>

          </div>
        </div>
      ) : null}
    </div>
  )
}

function SmtpForm({ state, onChange }: { state: SmtpPayload; onChange: (next: SmtpPayload) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="SMTP Server">
        <InputField
          value={state.smtp_server}
          onChange={(event) => onChange({ ...state, smtp_server: event.target.value })}
          placeholder="smtp.yourprovider.com"
        />
      </Field>
      <Field label="SMTP Port">
        <InputField
          type="number"
          value={state.smtp_port ? String(state.smtp_port) : ''}
          onChange={(event) => onChange({ ...state, smtp_port: Number(event.target.value) })}
          placeholder="587"
        />
      </Field>
      <Field label="Username">
        <InputField
          value={state.smtp_username}
          onChange={(event) => onChange({ ...state, smtp_username: event.target.value })}
          placeholder="user@company.com"
        />
      </Field>
      <Field label="Password">
        <InputField
          type="password"
          value={state.smtp_password_encrypted}
          onChange={(event) => onChange({ ...state, smtp_password_encrypted: event.target.value })}
          placeholder="••••••••"
        />
      </Field>
      <Field label="Use TLS">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <input
            type="checkbox"
            checked={state.use_tls}
            onChange={(event) => onChange({ ...state, use_tls: event.target.checked })}
          />
          <span className="text-sm text-[var(--color-text)]">Enable TLS</span>
        </div>
      </Field>
      <Field label="Use SSL">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <input
            type="checkbox"
            checked={state.use_ssl}
            onChange={(event) => onChange({ ...state, use_ssl: event.target.checked })}
          />
          <span className="text-sm text-[var(--color-text)]">Enable SSL</span>
        </div>
      </Field>
      <Field label="Max per session">
        <InputField
          type="number"
          value={state.max_per_session != null ? String(state.max_per_session) : ''}
          onChange={(event) => onChange({ ...state, max_per_session: Number(event.target.value) })}
          placeholder="50"
        />
      </Field>
    </div>
  )
}

function TwilioForm({ state, onChange }: { state: TwilioPayload; onChange: (next: TwilioPayload) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Twilio SID">
        <InputField
          value={state.twilio_sid}
          onChange={(event) => onChange({ ...state, twilio_sid: event.target.value })}
          placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </Field>
      <Field label="Auth Token">
        <InputField
          type="password"
          value={state.twilio_token}
          onChange={(event) => onChange({ ...state, twilio_token: event.target.value })}
          placeholder="••••••••"
        />
      </Field>
      <Field label="Sender Number">
        <InputField
          value={state.sender_number}
          onChange={(event) => onChange({ ...state, sender_number: event.target.value })}
          placeholder="+1234567890"
        />
      </Field>
    </div>
  )
}
