import type { RefObject } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { LOCAL_DELIVERY_STATS_OVERLAY_GRADIENT } from './LocalDeliveryStatsOverlay.constants'
import { LocalDeliveryStatsMetricsRow } from './LocalDeliveryStatsMetricsRow'
import { LocalDeliveryStatsTopSummary } from './LocalDeliveryStatsTopSummary'
import type { LocalDeliveryStatsOverlayData } from './LocalDeliveryStatsOverlay.types'

type LocalDeliveryStatsOverlayShellProps = {
  data: LocalDeliveryStatsOverlayData
  hidden: boolean
  compactMetrics: boolean
  showScrollHint: boolean
  scrollContainerRef: RefObject<HTMLDivElement | null>
  onHide: () => void
  onShow: () => void
}

export const LocalDeliveryStatsOverlayShell = ({
  data,
  hidden,
  compactMetrics,
  showScrollHint,
  scrollContainerRef,
  onHide,
  onShow,
}: LocalDeliveryStatsOverlayShellProps) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[20] flex w-full flex-col justify-end">
    <AnimatePresence mode="wait" initial={false}>
      {hidden ? (
        <motion.div
          key="stats-toggle"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none px-4 pb-4"
        >
          <button
            type="button"
            onClick={onShow}
            className="pointer-events-auto rounded-full border border-white/70 bg-white/18 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/24"
          >
            Stats
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="stats-panel"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none w-full px-4 pb-4 pt-16"
          style={{ background: LOCAL_DELIVERY_STATS_OVERLAY_GRADIENT }}
        >
          <div className="flex w-full flex-col gap-5">
            <button
              type="button"
              onClick={onHide}
              className="pointer-events-auto self-start rounded-full border border-white/75 bg-black/28 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/38"
            >
              Hide
            </button>

            <LocalDeliveryStatsTopSummary
              routeSummary={data.routeSummary}
              driver={data.driver}
            />

            <div className="w-full">
              <LocalDeliveryStatsMetricsRow
                metrics={data.metrics}
                compact={compactMetrics}
                showScrollHint={showScrollHint}
                scrollContainerRef={scrollContainerRef}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
