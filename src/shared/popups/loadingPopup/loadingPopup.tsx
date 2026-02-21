import { motion, AnimatePresence } from 'framer-motion'
import { useMobile } from "@/app/contexts/MobileContext";



type PropsPopupRoot = {
  children: React.ReactNode
}

export const LoadingPopup = ({
    children,
}: PropsPopupRoot) => {
    const {isMobile} = useMobile()

    return ( 
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Overlay */}
            {!isMobile && 
                <motion.div
                    className="absolute inset-0 popup-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                />
            }
            <motion.div
                className={`relative z-10 pointer-events-auto flex h-full  max-h-[100px] max-w-[100px] min-w-[100px] bg-[var(--color-page)]  flex-col rounded-none   text-[var(--color-text)] md:rounded-3xl`}
                initial={{ opacity: 0, y: 100 }}
                    animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                    duration: 0.3,
                    ease: 'easeOut',
                    },
                }}
                exit={{
                    opacity: 0,
                    y: 100,
                    transition: {
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: !isMobile ? 0.15 : 0,
                    },
                }}
            >
            {children}
        </motion.div>
        </div>
    );
}