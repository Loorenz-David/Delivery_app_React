import { useState } from 'react'

import { CloseIcon, MultiSelectIcon } from '@/assets/icons'
import { useMobile } from '@/app/contexts/MobileContext'
import { BasicButton } from '@/shared/buttons/BasicButton'

import {
  useLocalDeliverySelectionActions,
  useLocalDeliverySelectionMode,
  useSelectedLocalDeliveryOrdersSummary,
} from '../store/localDeliverySelectionHooks.store'

export const LocalDeliveryMapOverlay = () => {
  const { isMobile } = useMobile()
  const isSelectionMode = useLocalDeliverySelectionMode()
  const { count, totalWeight, totalItems, totalVolume } = useSelectedLocalDeliveryOrdersSummary()
  const { enableSelectionMode, disableSelectionMode } = useLocalDeliverySelectionActions()
  const [showStats, setShowStats] = useState(true)

  if (isMobile) {
    return null
  }

  if (!isSelectionMode) {
    return (
      <div className="pointer-events-auto absolute left-4 top-4 z-0">
        <BasicButton
          params={{
            variant: 'secondary',
            onClick: enableSelectionMode,
            ariaLabel: 'Enable local delivery multi select',
            className: 'border-[var(--color-muted)]/50',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <MultiSelectIcon className="h-5 w-5 fill-[var(--color-muted)]" />
            <span>Multi Select</span>
          </div>
        </BasicButton>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-0">
      <div className="relative w-72 rounded-xl border border-[var(--color-muted)]/30 bg-[var(--color-page)]/95 p-3 shadow-lg backdrop-blur-sm">
        <button
          aria-label="Exit local delivery selection mode"
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-muted)]/30 bg-[var(--color-page)] text-[var(--color-muted)] shadow-sm"
          onClick={disableSelectionMode}
          type="button"
        >
          <CloseIcon className="h-3 w-3" />
        </button>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-muted)]">{count} Local Delivery Orders Selected</p>
          <button
            className="text-xs text-[var(--color-muted)]/80 underline underline-offset-2"
            onClick={() => setShowStats((prev) => !prev)}
            type="button"
          >
            {showStats ? 'Hide stats' : 'Show stats'}
          </button>
        </div>

        {showStats && (
          <div className="mb-3 space-y-1 rounded-lg bg-[var(--color-muted)]/5 p-2 text-xs text-[var(--color-muted)]">
            <div className="flex w-full justify-between">
              <p>Total Items:</p>
              <p>{totalItems} pcs</p>
            </div>
            <div className="flex w-full justify-between">
              <p>Total Volume:</p>
              <p>{totalVolume.toFixed(2)} ㎥</p>
            </div>
            <div className="flex w-full justify-between">
              <p>Total Weight:</p>
              <p>{totalWeight.toFixed(2)} kg</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <BasicButton
            params={{
              variant: 'secondary',
              onClick: () => undefined,
              ariaLabel: 'Local delivery bulk action placeholder',
              disabled: true,
            }}
          >
            Bulk Action
          </BasicButton>
        </div>
      </div>
    </div>
  )
}

