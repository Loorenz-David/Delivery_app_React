import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ChevronDownIcon } from '../../assets/icons'


export function CollapsibleSection({
    title,
    children,
    defaultOpen = false,
}: {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    return (
        <section className="rounded-xl border border-[var(--color-border)] bg-white">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <span className=" text-md text-[var(--color-text)]">{title} </span>
                <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 1.2 }}
                >
                    <ChevronDownIcon className="h-4 w-4 text-[var(--color-muted)]" />
                </motion.div>
            </button>
            <AnimatePresence
                initial={false}
            >
                {isOpen && (
                <motion.div 
                    key="content"
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden border-t border-[var(--color-border)] px-4"
                >
                    <div className="py-4">
                        {children}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
