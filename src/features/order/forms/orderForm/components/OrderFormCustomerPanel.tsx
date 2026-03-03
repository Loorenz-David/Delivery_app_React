import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { CostumerSearchBar, type Costumer } from '@/features/costumer'

type OrderFormCustomerPanelProps = {
  costumer?: Costumer | null
  isCollapsed?: boolean
  onSelectCostumer?: (costumer: Costumer) => void
}

const formatPhone = (costumer: Costumer): string => {
  const primary = costumer.default_primary_phone?.phone
  if (!primary?.number) {
    return '-'
  }

  return `${primary.prefix ?? ''} ${primary.number}`.trim()
}

const formatAddress = (costumer: Costumer): string => {
  return costumer.default_address?.address?.street_address ?? '-'
}

const formatFullName = (costumer: Costumer): string => {
  return `${costumer.first_name} ${costumer.last_name}`.trim()
}

export const OrderFormCustomerPanel = ({
  costumer = null,
  isCollapsed = false,
  onSelectCostumer,
}: OrderFormCustomerPanelProps) => {
  const panelShell = (content: ReactNode) => (
    <motion.div
      className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-page)]"
      initial={{ x: 120, opacity: 0 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
          delay: 0.1,
        },
      }}
      exit={{
        opacity: 0,
        x: 100,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      }}
    >
      <div className="px-4 pb-3 pt-3">
        <span className="text-[12px] font-semibold">Costumer</span>
      </div>
      {content}
    </motion.div>
  )

  if (isCollapsed) {
    return panelShell(
      <div className="flex min-h-0 flex-1 items-center px-4 pb-3">
        <span className="text-[14px]">{costumer ? formatFullName(costumer) : 'Search costumer'}</span>
      </div>,
    )
  }

  if (!costumer) {
    return panelShell(
      <div className="px-4 pb-4">
        <CostumerSearchBar onSelectCostumer={(entry) => onSelectCostumer?.(entry)} />
      </div>,
    )
  }

  if (isCollapsed) {
    return panelShell(
      <div className="flex min-h-0 flex-1  px-4 pb-3">
        <span className="text-[14px] ">{formatFullName(costumer)}</span>

      </div>,
    )
  }

  return panelShell(
    <div className="flex flex-col gap-2 px-4 pb-4">
      <DisplayInfo label="Name:" value={formatFullName(costumer)} />
      <DisplayInfo label="Email:" value={costumer.email ?? '-'} />
      <DisplayInfo label="Phone:" value={formatPhone(costumer)} />
      <DisplayInfo label="Address:" value={formatAddress(costumer)} />
    </div>,
  )
}

const DisplayInfo = ({
  label,
  value,
  inline = false,
}: {
  label: string
  value: string
  inline?: boolean
}) => {
  if (inline) {
    return (
      <div className="flex items-center gap-1 text-[13px]">
        <span className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</span>
        <span>{value}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</span>
      <div className="flex gap-1 text-[14px]">
        <span>{value}</span>
      </div>
    </div>
  )
}
