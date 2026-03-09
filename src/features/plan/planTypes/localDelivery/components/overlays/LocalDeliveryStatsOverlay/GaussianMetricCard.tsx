import { useMemo, useState } from 'react'

import { ChevronDownIcon } from '@/assets/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

import type { LocalDeliveryGaussianMetricCard } from './LocalDeliveryStatsOverlay.types'

type GaussianMetricCardProps = {
  card: LocalDeliveryGaussianMetricCard
}

export const GaussianMetricCard = ({ card }: GaussianMetricCardProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFace = useMemo(
    () => card.faces[activeIndex] ?? card.faces[0],
    [activeIndex, card.faces],
  )

  const handleToggle = () => {
    if (card.faces.length <= 1) return
    setActiveIndex((current) => (current + 1) % card.faces.length)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="pointer-events-auto relative flex min-h-[126px] w-full flex-col justify-between rounded-2xl border border-white/45 bg-black/28 p-4 text-left text-sm text-white backdrop-blur-md transition-colors hover:bg-black/34"
    >
      <ChevronDownIcon className="-rotate-90 absolute right-3 top-3 h-4 w-4 text-white/70" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeFace.id}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full flex-col justify-between gap-4"
        >
          <div className="pr-6">
            <div className="text-sm font-semibold text-white">{activeFace.displayValue}</div>
            <div className="mt-1 text-xs font-medium text-white/76">{activeFace.label}</div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/18">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${activeFace.progressValue}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={cn('h-full rounded-full bg-lime-400', activeFace.accentClassName)}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
