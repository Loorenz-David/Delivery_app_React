import type { ComponentType } from 'react'
import { motion } from 'framer-motion'

import { useMobile } from '@/app/contexts/MobileContext'

type OrderFormShellProps<TViewProps extends object> = {
  onRequestClose?: () => void
  desktopView: ComponentType<TViewProps>
  mobileView: ComponentType<TViewProps>
  viewProps: TViewProps
}

export const OrderFormShell = <TViewProps extends object>({
  onRequestClose,
  desktopView: DesktopView,
  mobileView: MobileView,
  viewProps,
}: OrderFormShellProps<TViewProps>) => {
  const { isMobile } = useMobile()

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-auto bg-[var(--color-page)] text-[var(--color-text)]">
        <motion.div
          className="flex h-full w-full min-h-0 min-w-0 flex-col"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <MobileView {...viewProps} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onRequestClose}
        aria-label="Close popup"
      />
      <motion.div
        className="relative z-10 flex h-[min(92vh,900px)] w-[min(1120px,96vw)] min-h-0 min-w-0 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-page)] p-4 text-[var(--color-text)] shadow-lg"
        initial={{ opacity: 0, x: 90 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 90 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <DesktopView {...viewProps} />
      </motion.div>
    </div>
  )
}
