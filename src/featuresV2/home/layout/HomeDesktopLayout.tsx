import type { ReactNode } from 'react'
import {motion, AnimatePresence} from 'framer-motion'


interface HomeDesktopLayoutProps {
  map: ReactNode
  mapOverlay?: ReactNode
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
  mapOverlay,
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
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            {map}
            {mapOverlay}
          </div>
        </div>


        

        {/* Delivery plan */}
        <div className="relative z-10 h-full"> 
          <AnimatePresence mode="popLayout">
            {!isPlanVisible &&
                (
                  <motion.div className="absolute left-[-32px] top-0 z-10 flex items-center justify-center"
                    layout
                    initial={{x:100}}
                    animate={{x:0}}

                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                  >
                    {buttonTogglePlan}
                  </motion.div>
                )
              }
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {isPlanVisible && (
              <motion.div
                layout
                className="z-10 h-full"
                initial={{ x: 450 }}
                animate={{ x: 0 }}
                exit={{ x: 450 }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              >
                {plan}
              </motion.div>
            )} 
          </AnimatePresence>

         
         
        </div>

        {/* Overlay  sections */}
        <div className="relative z-20 h-full">{overlay}</div>

        {/* Orders without plan (base layer) */}
        
          <div className="relative z-30 h-full">
            {base}
            
            {/* Plan toggle button */}
           
            {/* Overlay sections */}
            <AnimatePresence mode="popLayout">
              {orderOverlay && (
                <motion.div className="absolute inset-1 z-40 h-full w-full"
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
