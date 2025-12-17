import { useEffect, useMemo, useState } from 'react'

import Popup_1 from '../../../components/popups/Popup_1'
import { ActionManager } from '../../../resources_manager/managers/ActionManager'
import { ResourcesManagerProvider } from '../../../resources_manager/resourcesManagerContext'
import { useActionEntries } from '../../../resources_manager/managers/ActionManager'
import { DeliveryRequestFormPanel } from '../components/section_panels/DeliveryRequestFormPanel'
import { popupMap } from '../components/popup_fills/popup_map'
import { formBridge, type FormHandoffPayload, type BridgeStatus } from '../../../webrtc/formBridge'
import { sessionStorage } from '../../../lib/storage/sessionStorage'
import { apiClient } from '../../../lib/api/ApiClient'

export function DeliveryRequestPage() {
  const [isFormActive, setIsFormActive] = useState(false)
  const [incomingPayload, setIncomingPayload] = useState<FormHandoffPayload | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<BridgeStatus>(formBridge.getStatus())
  const [connectionError, setConnectionError] = useState<string | null>(formBridge.getLastError())

  const popupManager = useMemo(
    () =>
      new ActionManager({
        blueprint: Popup_1,
        registry: popupMap,
      }),
    [],
  )
  useActionEntries(popupManager)

  useEffect(() => {
    // Strip access/refresh tokens on this page so only the socket token remains.
    const session = sessionStorage.getSession()
    const socketToken = session?.socketToken
    if (socketToken) {
      apiClient.replaceTokens('', '', socketToken)
      sessionStorage.setSession({
        accessToken: '',
        refreshToken: '',
        socketToken,
        user: null,
        identity: session?.identity ?? null,
      })
    } else {
      sessionStorage.clear()
    }
  }, [])

  useEffect(() => {
    formBridge.ensureConnection({ initiate: true })
    const unsubStatus = formBridge.onStatusChange((status, error) => {
      setConnectionStatus(status)
      setConnectionError(error ?? null)
    })
    const unsubMessage = formBridge.onMessage((message) => {
      if (message.type === 'form-request') {
        setIncomingPayload(message.payload || null)
        setIsFormActive(true)
      }
    })
    return () => {
      unsubStatus()
      unsubMessage()
    }
  }, [])

  return (
    <ResourcesManagerProvider managers={{ popupManager }}>
      <div className="min-h-screen min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
        <div className="flex flex-col mx-auto h-full max-w-5xl px-4 py-10 md:px-8 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">Linked device status</p>
              <p className="text-xs text-[var(--color-muted)]">
                {connectionStatus === 'connected'
                  ? 'Secure channel ready. You can fill and submit the form.'
                  : connectionStatus === 'connecting'
                  ? 'Trying to connect to the paired device...'
                  : connectionStatus === 'error'
                  ? connectionError || 'Connection issue. Attempting to reconnect.'
                  : 'Waiting for the paired device to join.'}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {connectionStatus}
            </span>
          </div>
          <DeliveryRequestFormPanel
            isActive={isFormActive}
            onOpen={() => setIsFormActive(true)}
            onClose={() => setIsFormActive(false)}
            collapseOnSubmit={false}
            incomingPayload={incomingPayload}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            onSubmitResponse={(payload) => {
              formBridge.sendFormResponse(payload)
              setIsFormActive(false)
            }}
          />

        </div>
      </div>
      {popupManager.renderStack()}
    </ResourcesManagerProvider>
  )
}
