import type { ReactNode } from 'react'
import {motion, AnimatePresence} from 'framer-motion'


interface HomeDesktopLayoutProps {
  map: ReactNode
  plan?: ReactNode
  base: ReactNode
  overlay: ReactNode
  orderOverlay?: ReactNode
  buttonTogglePlan?: ReactNode
  isPlanVisible: boolean
  mapResize: ()=> void
}

export function HomeDesktopLayout({
  map,
  mapResize,
  plan,
  base,
  overlay,
  orderOverlay,
  buttonTogglePlan,
  isPlanVisible,
}: HomeDesktopLayoutProps) {




  return (

      <main className="flex flex-1 overflow-hidden relative justify-end">
        {/* Map */}

        {map}


        

        {/* Delivery plan */}
        <AnimatePresence mode="popLayout">
          {isPlanVisible && (
            <motion.div
              layout
              className="h-full z-1"
              initial={{ x: 450 }}
              animate={{ x: 0 }}
              exit={{ x: 450 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              {plan}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay  sections */}
        <div className="h-full relative z-2">{overlay}</div>

        {/* Orders without plan (base layer) */}
        
          <div className="relative h-full z-3">
            {base}
            
            {/* Plan toggle button */}
            {buttonTogglePlan && (
              <div className="absolute z-20"
                style={{
                  top: '50%',
                  left: '-9px',
                  transform: 'translateY(-50%)',
                  
                }}
              >
                {buttonTogglePlan}
              </div>
            )}
            {/* Overlay sections */}
            <AnimatePresence mode="popLayout">
              {orderOverlay && (
                <motion.div className="absolute inset-1  z-10 w-full h-full"
                  layout
                  key={orderOverlay ? 'with-order' : 'without-order'}
                  initial={{ x: 450}}
                  animate={{ x: 0 }}
                  exit={{ x: 450 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {orderOverlay}
                </motion.div>
                )}
            </AnimatePresence>

          </div>
      </main>

  )
}