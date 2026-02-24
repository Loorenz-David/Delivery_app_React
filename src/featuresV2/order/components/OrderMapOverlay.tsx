import { useState } from 'react'

import { CloseIcon, MultiSelectIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { useMobile } from '@/app/contexts/MobileContext'
import { usePopupManager } from '@/shared/resource-manager/useResourceManager'

import {
  useOrderSelectionActions,
  useOrderSelectionMode,
  useSelectedOrderServerIds,
  useSelectedOrdersSummary,
} from '../store/orderSelectionHooks.store'

export const OrderMapOverlay = () => {
  const { isMobile } = useMobile()
  const popupManager = usePopupManager()
  const isSelectionMode = useOrderSelectionMode()
  const selectedOrderServerIds = useSelectedOrderServerIds()
  const { count, totalWeight, totalItems, totalVolume } = useSelectedOrdersSummary()
  const { enableSelectionMode, disableSelectionMode } = useOrderSelectionActions()
  const [showStats, setShowStats] = useState(true)

  if (isMobile) {
    return null
  }

  if (!isSelectionMode) {
    return (
      <div className="absolute left-4 top-4 z-0 pointer-events-auto">
        <BasicButton
          params={{
            variant: 'secondary',
            onClick: enableSelectionMode,
            ariaLabel: 'Enable multi order selection',
            className:'border-[var(--color-muted)]/50'
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <MultiSelectIcon className="fill-[var(--color-muted)] h-5 w-5"/> 
            <span>
              Multi Select
            </span>
          </div>
        </BasicButton>
      </div>
    )
  }

  return (
    <div className="absolute left-4 top-4 z-0 pointer-events-auto">
      <div className="relative w-72 rounded-xl border border-[var(--color-muted)]/30 bg-[var(--color-page)]/95 p-3 shadow-lg backdrop-blur-sm">
        <button
          aria-label="Exit selection mode"
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-muted)]/30 bg-[var(--color-page)] text-[var(--color-muted)] shadow-sm"
          onClick={disableSelectionMode}
          type="button"
        >
          <CloseIcon className="h-3 w-3" />
        </button>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-muted)]">{count} Orders Selected</p>
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
          <div className="flex justify-between w-full">
            <p>Total Items:</p>
            <p> {totalItems} pcs</p>
          </div>
          <div className="flex justify-between w-full">
            <p>Total Volume:</p>
            <p> {totalVolume.toFixed(2)} ㎥</p>
          </div>
          <div className="flex justify-between w-full">
            <p>Total Weight:</p>
            <p> {totalWeight.toFixed(2)} kg</p>
          </div>
          
          
          
        </div>
      )}

      <div className="flex items-center gap-2">
        <BasicButton
          params={{
            variant: 'secondary',
            onClick: () => undefined,
            ariaLabel: 'Select plan',
            disabled: true,
          }}
        >
          Select Plan
        </BasicButton>
        <BasicButton
          params={{
            variant: 'primary',
            onClick: () => {
              popupManager.open({
                key: 'PlanForm',
                payload: {
                  mode: 'create',
                  selectedOrderServerIds,
                  source: 'order_multi_select',
                },
              })
            },
            ariaLabel: 'Create plan from selected orders',
          }}
        >
          + Plan
        </BasicButton>
      </div>
    </div>
    </div>
  )
}
