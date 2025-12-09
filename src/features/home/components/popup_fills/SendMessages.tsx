import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { SettingsSearchBar } from '../../../settings/components/ui/SearchBar'
import { MessageCard } from '../../../settings/components/section_cards/MessageCard'
import type { SettingsMessageTemplate } from '../../../settings/types'
import { MessageTemplateService } from '../../../settings/api/messageTemplateService'
import type { OrderPayload } from '../../types/backend'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { BackArrowIcon, ChevronDownIcon, CloseIcon, MailIcon, MessageIcon } from '../../../../assets/icons'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { computeArrivalRange } from '../../utils/arrivalRange'
import { NotificationService, type NotificationSendReport } from '../../api/notificationService'

type TemplateSelection = Partial<Record<'email' | 'sms', SettingsMessageTemplate>>
type TemplateSelectionIds = Partial<Record<'email' | 'sms', number>>

interface SendMessagesPayload {
  targets?: OrderPayload[]
  arrival_time_range?: number
}

interface SendMessagesProps extends ActionComponentProps<SendMessagesPayload> {
  selectionMode?: boolean
  onTemplatesSelected?: (selection: TemplateSelectionIds) => void
  onCloseSelection?: () => void
  initialTemplateSelection?: TemplateSelectionIds
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All channels' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
]

function buildSearchQuery(value: string, channel: string) {
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
}

function TargetCard({
  order,
  onRemove,
  status,
}: {
  order: OrderPayload
  onRemove: (orderId: number) => void
  status?: { email?: 'sent' | 'fail'; sms?: 'sent' | 'fail' }
}) {
  const itemCount = order.delivery_items?.length ?? 0
  const address =
    order.client_address?.raw_address ??
    order.client_address?.street_address ??
    order.client_address?.city ??
    'No address'

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-page)] text-[var(--color-text)]">
        <span className="text-xs font-semibold uppercase tracking-wide"># {typeof order.delivery_arrangement == "number" ? order.delivery_arrangement + 1 : '' }</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex gap-3 items-baseline">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{order.client_first_name ?? 'Customer'}</p>
         
        </div>
        <p className="truncate text-xs text-[var(--color-muted)]">{address}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[var(--color-page)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text)]">
          {itemCount} items
        </span>
        <div className="flex gap-1">
          <ChannelTag label="Email" status={status?.email} />
          <ChannelTag label="SMS" status={status?.sms} />
        </div>
        <button
          type="button"
          aria-label="Remove target"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text)] transition hover:bg-[var(--color-accent)]"
          onClick={() => onRemove(order.id)}
        >
          <CloseIcon className="app-icon h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ChannelTag({ label, status }: { label: string; status?: 'sent' | 'fail' }) {
  if (!status) {
    return null
  }
  const isSent = status === 'sent'
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
        isSent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {label}
    </span>
  )
}

const STORAGE_KEY = 'templatesForOrderCreation'

const SendMessages = ({
  payload,
  setPopupHeader,
  selectionMode = false,
  onTemplatesSelected,
  onCloseSelection,
  initialTemplateSelection,
}: SendMessagesProps) => {
  const templateService = useMemo(() => new MessageTemplateService(), [])
  const notificationService = useMemo(() => new NotificationService(), [])
  const { showMessage } = useMessageManager()
  const deliveryTimeRange = payload?.arrival_time_range ?? 30
  const [isTargetsOpen, setIsTargetsOpen] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [templates, setTemplates] = useState<SettingsMessageTemplate[]>([])
  const [defaultTemplates, setDefaultTemplates] = useState<SettingsMessageTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateSelection>({})
  const [removedTargets, setRemovedTargets] = useState<OrderPayload[]>([])
  const [messageStatuses, setMessageStatuses] = useState<Record<number, { email?: 'sent' | 'fail'; sms?: 'sent' | 'fail' }>>({})
  const initialSelectionRef = useRef<TemplateSelectionIds | null>(null)
  const channelTotals = useMemo(() => {
    let emailSent = 0
    let emailFail = 0
    let smsSent = 0
    let smsFail = 0
    Object.values(messageStatuses).forEach(({ email, sms }) => {
      if (email === 'sent') emailSent += 1
      if (email === 'fail') emailFail += 1
      if (sms === 'sent') smsSent += 1
      if (sms === 'fail') smsFail += 1
    })
    return { emailSent, emailFail, smsSent, smsFail }
  }, [messageStatuses])
  const needsArrivalRange = useMemo(
    () =>
      [selectedTemplates.email, selectedTemplates.sms].some((template) =>
        template?.content?.includes('{{arrival_time_range}}'),
      ),
    [selectedTemplates],
  )

  const initialTargets = useMemo(() => {
    if (Array.isArray(payload?.targets) && payload.targets.length > 0) {
      return payload.targets
    }
    return []
  }, [payload?.targets])

  const [targetClients, setTargetClients] = useState<OrderPayload[]>(initialTargets)

  useEffect(() => {
    setTargetClients(initialTargets)
  }, [initialTargets])

  useEffect(() => {
    if (!setPopupHeader) {
      return
    }
    const total = targetClients.length
    setPopupHeader(
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-page)]">
          <MessageIcon className="app-icon h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)]">Send messages</p>
          <p className="text-xs text-[var(--color-muted)]">
            {total > 0 ? `${total} target${total === 1 ? '' : 's'} selected` : 'No targets selected yet'}
          </p>
        </div>
      </div>,
    )
  }, [setPopupHeader, targetClients.length])

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true)
    try {
      const response = await templateService.fetchTemplates({ query: {} })
      const items = response.data?.items ?? []
      setTemplates(items)
      setDefaultTemplates(items)
    } catch (error) {
      console.error('Failed to load templates', error)
      showMessage({ status: 500, message: 'Unable to load message templates.' })
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [showMessage, templateService])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (!selectionMode) {
      return
    }
    const fromProp = initialTemplateSelection
    if (fromProp && Object.keys(fromProp).length > 0) {
      initialSelectionRef.current = fromProp
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TemplateSelectionIds
        initialSelectionRef.current = parsed
      }
    } catch (error) {
      console.error('Failed to read stored templates', error)
    }
  }, [selectionMode, initialTemplateSelection])

  useEffect(() => {
    if (!selectionMode) {
      return
    }
    const ids = initialSelectionRef.current
    if (!ids || (!ids.email && !ids.sms)) {
      return
    }
    if (!templates.length) {
      return
    }
    setSelectedTemplates((prev) => {
      const next = { ...prev }
      if (ids.email) {
        const match = templates.find((template) => template.channel === 'email' && template.id === ids.email)
        if (match) {
          next.email = match
        }
      }
      if (ids.sms) {
        const match = templates.find((template) => template.channel === 'sms' && template.id === ids.sms)
        if (match) {
          next.sms = match
        }
      }
      return next
    })
  }, [selectionMode, templates])

  const searchService = useCallback(
    async (queryFilters: { query: Record<string, unknown> }) => {
      const response = await templateService.fetchTemplates(queryFilters)
      return response.data?.items ?? []
    },
    [templateService],
  )

  const handleSearchResults = useCallback((results: SettingsMessageTemplate[]) => {
    setTemplates(results)
  }, [])

  const handleSearchReset = useCallback(() => {
    setTemplates(defaultTemplates)
  }, [defaultTemplates])

  const handleTemplateSelect = useCallback((template: SettingsMessageTemplate) => {
    setSelectedTemplates((prev) => {
      const current = prev[template.channel]
      if (current?.id === template.id) {
        const next = { ...prev }
        delete next[template.channel]
        return next
      }
      return { ...prev, [template.channel]: template }
    })
  }, [])

  const removeTarget = useCallback((orderId: number) => {
    setTargetClients((prev) => {
      const target = prev.find((order) => order.id === orderId)
      if (target) {
        setRemovedTargets((old) => [target, ...old])
      }
      return prev.filter((order) => order.id !== orderId)
    })
  }, [])

  const restoreLastRemoved = useCallback(() => {
    setRemovedTargets((prev) => {
      if (prev.length === 0) {
        return prev
      }
      const [latest, ...rest] = prev
      setTargetClients((current) => [latest, ...current])
      return rest
    })
  }, [])

  const handleSend = useCallback(async () => {
    const templates_id: Record<string, number> = {}
    if (selectedTemplates.email) {
      templates_id.email = selectedTemplates.email.id
    }
    if (selectedTemplates.sms) {
      templates_id.sms = selectedTemplates.sms.id
    }
    if (Object.keys(templates_id).length === 0) {
      showMessage({ status: 400, message: 'Select at least one template to continue.' })
      return
    }
    if (selectionMode) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(templates_id))
        }
      } catch (error) {
        console.error('Unable to persist template selection', error)
      }
      onTemplatesSelected?.(templates_id)
      onCloseSelection?.()
      showMessage({ status: 'success', message: 'Templates selected for order creation.' })
      return
    }
    if (targetClients.length === 0) {
      showMessage({ status: 400, message: 'Add at least one target before sending.' })
      return
    }
    const resolvedRange = deliveryTimeRange
    const targetPayload = needsArrivalRange
      ? targetClients.map((order) => {
          const arrival_time_range = computeArrivalRange(order.expected_arrival_time, resolvedRange)
          return arrival_time_range ? { ...order, arrival_time_range } : order
        })
      : targetClients
    const payloadToSend = {
      templates_id,
      target_clients: targetPayload,
    }
    setIsSending(true)
    try {
      const response = await notificationService.sendNotifications(payloadToSend)
      const report = response.data ?? (response as unknown as NotificationSendReport)
      const emailSent = report.email?.sent_emails?.length ?? 0
      const emailFail = report.email?.fail_emails?.length ?? 0
      const smsSent = report.sms?.sent_sms?.length ?? 0
      const smsFail = report.sms?.fail_sms?.length ?? 0
      const totalSent = emailSent + smsSent
      showMessage({
        status: 'success',
        message: `Sent ${totalSent} messages. Failed: email ${emailFail}, sms ${smsFail}.`,
      })
      const statusMap: Record<number, { email?: 'sent' | 'fail'; sms?: 'sent' | 'fail' }> = {}
      const markStatus = (list: OrderPayload[] | undefined, channel: 'email' | 'sms', outcome: 'sent' | 'fail') => {
        list?.forEach((order) => {
          const id = order.id
          if (typeof id !== 'number') return
          if (!statusMap[id]) {
            statusMap[id] = {}
          }
          statusMap[id][channel] = outcome
        })
      }
      markStatus(report.email?.sent_emails, 'email', 'sent')
      markStatus(report.email?.fail_emails, 'email', 'fail')
      markStatus(report.sms?.sent_sms, 'sms', 'sent')
      markStatus(report.sms?.fail_sms, 'sms', 'fail')
      setMessageStatuses(statusMap)
    } catch (error) {
      console.error('Failed to send notifications', error)
      showMessage({ status: 500, message: 'Failed to send messages. Please try again.' })
    } finally {
      setIsSending(false)
    }
  }, [
    deliveryTimeRange,
    needsArrivalRange,
    notificationService,
    onCloseSelection,
    onTemplatesSelected,
    selectedTemplates,
    selectionMode,
    showMessage,
    targetClients,
  ])

  return (
    <div className="flex h-full flex-col gap-5 pb-4">
      <SettingsSearchBar<SettingsMessageTemplate[], { query: Record<string, unknown> }>
        filterOptions={FILTER_OPTIONS}
        service={searchService}
        onResults={handleSearchResults}
        onReset={handleSearchReset}
        placeholder="Search by name or content"
        buildQuery={buildSearchQuery}
        defaultFilter="all"
        className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-text)]">Message templates</p>
          <span className="text-xs text-[var(--color-muted)]">{templates.length} results</span>
        </div>
        {isLoadingTemplates ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/60 p-4 text-sm text-[var(--color-muted)]">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/60 p-4 text-sm text-[var(--color-muted)]">
            No templates found. Try a different search.
          </div>
        ) : (
          <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
            {templates.map((template) => (
              <MessageCard
                key={template.id}
                template={template}
                selectable
                isSelected={selectedTemplates[template.channel]?.id === template.id}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          onClick={() => setIsTargetsOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">Targets</span>
            <span className="rounded-full bg-[var(--color-page)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text)]">
              {targetClients.length}
            </span>
            <div className="flex items-center gap-1">
              {channelTotals.emailSent > 0 ? <ChannelTag label={`Email ${channelTotals.emailSent}`} status="sent" /> : null}
              {channelTotals.smsSent > 0 ? <ChannelTag label={`SMS ${channelTotals.smsSent}`} status="sent" /> : null}
              {channelTotals.emailFail > 0 ? <ChannelTag label={`Email ${channelTotals.emailFail}`} status="fail" /> : null}
              {channelTotals.smsFail > 0 ? <ChannelTag label={`SMS ${channelTotals.smsFail}`} status="fail" /> : null}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {removedTargets.length > 0 ? (
              <div
                role="button"
                className="flex pointer-cursor items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-accent)]"
                onClick={(event) => {
                  event.stopPropagation()
                  restoreLastRemoved()
                }}
              >
                <BackArrowIcon className="app-icon h-4 w-4" />
                
              </div>
            ) : null}
            <ChevronDownIcon
              className={`app-icon h-4 w-4 text-[var(--color-muted)] transition-transform ${
                isTargetsOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        {isTargetsOpen ? (
          <div className="space-y-2 border-t border-[var(--color-border)] px-4 py-3">
            {targetClients.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">No targets selected.</p>
            ) : (
              <div className="grid max-h-[300px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                {targetClients.map((order) => (
                  <TargetCard key={order.id} order={order} onRemove={removeTarget} status={messageStatuses[order.id]} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-page)] px-2 py-1 font-semibold text-[var(--color-text)]">
            <MailIcon className="app-icon h-3 w-3" />
            {selectedTemplates.email ? `Email: ${selectedTemplates.email.name}` : 'Email template: none'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-page)] px-2 py-1 font-semibold text-[var(--color-text)]">
            <MessageIcon className="app-icon h-3 w-3" />
            {selectedTemplates.sms ? `SMS: ${selectedTemplates.sms.name}` : 'SMS template: none'}
          </span>
        </div>
      <BasicButton
        params={{
          variant: 'primary',
          className: 'w-full py-3 text-base font-semibold',
          onClick: handleSend,
          disabled: (!selectionMode && targetClients.length === 0) || isSending,
        }}
      >
        {selectionMode ? 'Select template(s)' : isSending ? 'Sending…' : 'Send messages'}
      </BasicButton>
      </div>
    </div>
  )
}

export default SendMessages
