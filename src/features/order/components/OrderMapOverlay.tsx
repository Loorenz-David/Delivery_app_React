import { useEffect, useState } from 'react'

import { CloseIcon, EraseIcon, MultiSelectIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { useMobile } from '@/app/contexts/MobileContext'
import {
  DRAWING_SELECTION_CLEAR_EVENT,
  DRAWING_SELECTION_MODE_EVENT,
  type DrawingSelectionMode,
} from '@/shared/map/domain/constants/drawingSelectionModes'
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
  const [selectedShape, setSelectedShape] = useState<DrawingSelectionMode>('circle')

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedShape('circle')
    }
  }, [isSelectionMode])

  const handleShapeSelection = (mode: DrawingSelectionMode) => {
    setSelectedShape(mode)
    if (typeof window === 'undefined') {
      return
    }

    window.dispatchEvent(
      new CustomEvent(DRAWING_SELECTION_MODE_EVENT, {
        detail: { mode },
      }),
    )
  }

  const handleEraseSelection = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.dispatchEvent(new CustomEvent(DRAWING_SELECTION_CLEAR_EVENT))
  }

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

        <div className="absolute -right-36 top-0 flex w-32 flex-col gap-2 cursor-pointer">
          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={handleEraseSelection}
              aria-label="Clear selection shape"
              className="flex items-center justify-center rounded-md border-1 border-[var(--color-muted)]/40 bg-[var(--color-page)] p-2 cursor-pointer"
            >
              <EraseIcon className="h-3 w-3 text-[var(--color-muted)]"/>
            </button>
          </div>
          {(['circle', 'rectangle', 'polygon'] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              onClick={() => handleShapeSelection(shape)}
              className={`rounded-md border px-3 py-2 text-left text-xs font-medium capitalize transition ${
                selectedShape === shape
                  ? ' bg-[var(--color-page)] text-[var(--color-dark-blue)] border-[var(--color-light-blue)]'
                  : 'border-[var(--color-muted)]/40 bg-[var(--color-page)] text-[var(--color-muted)]'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>

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
