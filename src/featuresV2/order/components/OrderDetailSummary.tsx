import { formatPhone } from '@/shared/data-validation/phoneValidation'
import { StateCard } from '@/shared/layout/StateCard'
import { useState } from 'react'

import type { Order } from '../types/order'
import type { OrderState } from '../types/orderState'
import { AccordionSection } from '@/shared/layout/AccordionSection'
import type { PropsWithChildren } from 'react'
import { formatIsoDate } from '@/shared/utils/formatIsoDate'

type OrderDetailSummaryProps = {
  order: Order | null
  orderState: OrderState | null
}

type SummarySectionKey = 'details' | 'client' | 'dates'

const asText = (value?: string | null) => value || '—'

export const OrderDetailSummary = ({ order, orderState }: OrderDetailSummaryProps) => {
  const [openSection, setOpenSection] = useState<SummarySectionKey | null>(null)

  const toggleSection = (section: SummarySectionKey) => {
    setOpenSection((current) => (current === section ? null : section))
  }

  return (
    <>
      <AccordionSection
        title={"Details"}
        isOpen={openSection === 'details'}
        onToggle={() => toggleSection('details')}
      >
        <div className="flex flex-col gap-4 p-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-muted)]">Reference</p>
              <p>{asText(order?.reference_number)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">State</p>
              {orderState ? (
                <StateCard label={orderState.name} color={orderState.color ?? '#363636'} style={{ maxWidth: '120px' }} />
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-sm">
              <p className="text-xs text-[var(--color-muted)]">Tracking number</p>
              <p>{asText(order?.tracking_number)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Plan objective</p>
              <p>{asText(order?.order_plan_objective)}</p>
            </div>
          </div>
          
        </div>
      </AccordionSection>
      <AccordionSection
        title={"Client information"}
        isOpen={openSection === 'client'}
        onToggle={() => toggleSection('client')}
      >
          <SummaryCard>
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Customer</p>
                  <p>{`${asText(order?.client_first_name)} ${asText(order?.client_last_name)}`.trim()}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Email</p>
                  <p>{asText(order?.client_email)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Phone</p>
                  <p>{formatPhone(order?.client_primary_phone)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Second Phone</p>
                  <p>{formatPhone(order?.client_secondary_phone)}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-xs text-[var(--color-muted)]">Address</p>
                <p>{asText(order?.client_address?.street_address)}</p>
              </div>
            </>
          </SummaryCard>
      </AccordionSection>
      <AccordionSection
        title={"Dates & Times"}
        isOpen={openSection === 'dates'}
        onToggle={() => toggleSection('dates')}
      >
        <SummaryCard>
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-muted)]">Start Date</p>
                <p>{formatIsoDate(order?.earliest_delivery_date)?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)]">Start Time</p>
                <p>{order?.preferred_time_start ?? '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-muted)]">End Date</p>
                <p>{formatIsoDate(order?.latest_delivery_date) ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)]">End Time</p>
                <p>{order?.preferred_time_end ?? '—'}</p>
              </div>
            </div>
          </>
        </SummaryCard>
      </AccordionSection>

    </>
  )
}

const SummaryCard = ({children}:PropsWithChildren)=>{
  return (
    <div className="flex flex-col gap-4 p-1">
      {children}
    </div>
  )
}
