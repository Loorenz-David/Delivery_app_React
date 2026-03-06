import { useState } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'

import { BoldArrowIcon, TriangleWarningIcon } from '@/assets/icons'
import { FloatingPopover } from '@/shared/popups/FloatingPopover/FloatingPopover'
import { formatRouteTime } from '@/features/plan/planTypes/localDelivery/utils/formatRouteTime'
import type { LocalDeliveryAddressGroup } from '@/features/plan/planTypes/localDelivery/domain/localDeliveryAddressGroup.flow'
import { LocalDeliveryOrderGroupChildren } from './LocalDeliveryOrderGroupChildren'

type LocalDeliveryOrderGroupCardProps = {
  group: LocalDeliveryAddressGroup
  expanded: boolean
  onToggleExpanded: () => void
  planStartDate?: string | null
  projectedStopOrderByClientId?: Map<string, number> | null
  dragAttributes?: DraggableAttributes
  dragListeners?: any
}

const formatRange = (
  minEta: string | null,
  maxEta: string | null,
  planStartDate?: string | null,
): string => {
  if (!minEta && !maxEta) return '--'
  const left = minEta ? formatRouteTime(minEta, planStartDate) : '--'
  const right = maxEta ? formatRouteTime(maxEta, planStartDate) : '--'
  return `${left} - ${right}`
}

export const LocalDeliveryOrderGroupCard = ({
  group,
  expanded,
  onToggleExpanded,
  planStartDate,
  projectedStopOrderByClientId,
  dragAttributes,
  dragListeners,
}: LocalDeliveryOrderGroupCardProps) => {
  const [warningOpen, setWarningOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div
        className="flex cursor-pointer items-center gap-3"
        onClick={onToggleExpanded}
        {...dragAttributes}
        {...dragListeners}
      >
        <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 px-2 text-xs font-semibold text-[var(--color-primary)]">
          {group.entries.length}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{group.label}</p>
          <p className="text-xs text-[var(--color-muted)]">
            Stops {group.firstStopOrder ?? '--'} - {group.lastStopOrder ?? '--'}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{formatRange(group.minEta, group.maxEta, planStartDate)}</p>
        </div>

        {group.hasWarnings ? (
          <FloatingPopover
            open={warningOpen}
            onOpenChange={setWarningOpen}
            offSetNum={6}
            classes="flex-none"
            reference={(
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50"
                onMouseEnter={() => setWarningOpen(true)}
                onMouseLeave={() => setWarningOpen(false)}
                onClick={(event) => event.stopPropagation()}
              >
                <TriangleWarningIcon className="h-4 w-4 text-amber-600" />
              </div>
            )}
          >
            <div
              className="w-52 rounded-xl border border-[var(--color-border)] bg-white p-3 text-xs shadow-lg"
              onMouseEnter={() => setWarningOpen(true)}
              onMouseLeave={() => setWarningOpen(false)}
            >
              Order stop -- has warning.
            </div>
          </FloatingPopover>
        ) : null}

        <BoldArrowIcon
          className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : 'rotate-0'}`}
        />
      </div>

      {expanded ? (
        <LocalDeliveryOrderGroupChildren
          entries={group.entries}
          planStartDate={planStartDate}
          projectedStopOrderByClientId={projectedStopOrderByClientId}
        />
      ) : null}
    </div>
  )
}
