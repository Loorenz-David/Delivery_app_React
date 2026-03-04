import { useMemo } from 'react'

import { useSnapScroll } from '../hooks/useSnapScroll'

type TimeColumnProps = {
  label: string
  values: number[]
  value: number
  onChange: (value: number) => void
  itemHeight?: number
  visibleCount?: number
  formatter?: (value: number) => string
}

const SCALE_STEPS = [1, 0.92, 0.86, 0.8]
const OPACITY_STEPS = [1, 0.65, 0.35, 0.15]

const getVisualStyleByDistance = (distance: number) => {
  const index = Math.min(distance, SCALE_STEPS.length - 1)
  return {
    transform: `scale(${SCALE_STEPS[index]})`,
    opacity: OPACITY_STEPS[index],
  }
}

export const TimeColumn = ({
  label,
  values,
  value,
  onChange,
  itemHeight = 36,
  visibleCount = 5,
  formatter,
}: TimeColumnProps) => {
  const topBottomPadding = useMemo(
    () => ((visibleCount - 1) / 2) * itemHeight,
    [itemHeight, visibleCount],
  )

  const {
    scrollRef,
    selectedIndex,
    onWheel,
    onScroll,
    onPointerEnter,
    onPointerLeave,
  } = useSnapScroll({
    values,
    value,
    itemHeight,
    onChange,
  })

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </div>
      <div
        className="relative overflow-hidden rounded-lg border border-[var(--color-border-accent)]/60 bg-[var(--color-page)]"
        style={{ height: itemHeight * visibleCount }}
      >
        <div
          className="pointer-events-none absolute inset-x-1 z-10 rounded-md border border-[var(--color-dark-blue)]/20 bg-[var(--color-dark-blue)]/5"
          style={{
            top: topBottomPadding,
            height: itemHeight,
          }}
        />

        <div
          ref={scrollRef}
          role="listbox"
          aria-label={label}
          className="h-full overflow-y-auto"
          style={{
            paddingTop: topBottomPadding,
            paddingBottom: topBottomPadding,
            scrollbarWidth: 'none',
          }}
          onWheel={onWheel}
          onScroll={onScroll}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          {values.map((entry, index) => {
            const distance = Math.abs(index - selectedIndex)
            const visual = getVisualStyleByDistance(distance)

            return (
              <button
                key={`${label}-${entry}`}
                type="button"
                role="option"
                aria-selected={entry === value}
                onClick={() => onChange(entry)}
                className="flex w-full items-center justify-center px-2 text-sm text-[var(--color-text)] transition-[transform,opacity] duration-150"
                style={{
                  height: itemHeight,
                  ...visual,
                }}
              >
                {formatter ? formatter(entry) : entry}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
