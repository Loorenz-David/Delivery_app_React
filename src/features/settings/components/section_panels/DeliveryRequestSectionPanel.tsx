import { useMemo } from 'react'

import { DeliveryRequestFormPanel } from '../../../external_form/components/section_panels/DeliveryRequestFormPanel'
import type { BridgeStatus, FormHandoffPayload } from '../../../../webrtc/formBridge'

export function DeliveryRequestSectionPanel() {
  const pageLink = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/delivery-request'
    }
    return `${window.location.origin}/delivery-request`
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">Full-page form</p>
          <p className="text-xs text-[var(--color-muted)]">Share this link to open the delivery request as its own page.</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
          {pageLink}
        </div>
      </div>

      <DeliveryRequestFormPanel
        isActive
        onOpen={() => {}}
        onClose={() => {}}
        connectionStatus={'idle' as BridgeStatus}
        connectionError={null}
        onSubmitResponse={(_payload: FormHandoffPayload) => {}}
      />
    </div>
  )
}
