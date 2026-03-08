import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/cn'

type HalfGaugeStatProps = {
  label: string
  value: number
  displayValue: string
  accentClassName?: string
}

const TRACK_PATH = 'M 12 88 A 38 38 0 0 1 88 88'

export const HalfGaugeStat = ({
  label,
  value,
  displayValue,
  accentClassName,
}: HalfGaugeStatProps) => {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="flex h-full min-w-[180px] shrink-0 flex-col items-center justify-between rounded-2xl px-2 py-1 text-sm text-white">
      <div className="relative h-[110px] w-[150px]">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.88)"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={100}
          />
          <motion.path
            d={TRACK_PATH}
            fill="none"
            strokeLinecap="round"
            strokeWidth="8"
            pathLength={100}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clampedValue / 100 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className={cn('stroke-lime-400', accentClassName)}
          />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{displayValue}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-white/96">{label}</span>
    </div>
  )
}
