import { motion } from 'framer-motion'
import { forwardRef } from 'react'

interface DarkOverlayProps {
  onClick?: () => void
  className?: string
  zIndex?: number
}

export const DarkOverlay = forwardRef<HTMLDivElement, DarkOverlayProps>(
  ({ onClick, className = '', zIndex = 20 }, ref) => {
    return (
      <motion.div
        ref={ref}
        onClick={onClick}
        className={`fixed inset-0  bg-black/20 backdrop-blur-xs ${className}`}
        style={{ zIndex }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      />
    )
  },
)

DarkOverlay.displayName = 'DarkOverlay'