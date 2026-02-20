import { motion } from 'framer-motion'
import { useState } from 'react'
import type{ ReactNode } from 'react'
import { FloatingPopover } from '@/shared/popups/FloatingPopover/FloatingPopover'

import { ChevronDownIcon } from '../../assets/icons'


export function CollapsibleSection({
    title,
    children,
    defaultOpen = false,
    closeOnInsideClick
}: {
    title: string | ReactNode
    children: ReactNode
    defaultOpen?: boolean
    closeOnInsideClick?: boolean
}) {   
    const [isOpen, setIsOpen] = useState(defaultOpen)


    return (

        <FloatingPopover
            open={ isOpen }
            onOpenChange={ setIsOpen }
            matchReferenceWidth={true}
            closeOnInsideClick={ closeOnInsideClick }
            reference={
                <section className="rounded-xl border border-[var(--color-border)] bg-white">
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                        {typeof title == 'string' ? 
                            <span className="text-base  text-[var(--color-text)]">
                                {title}
                            </span>
                            : 
                            <div className="flex">
                                {title}
                            </div>
                        }
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDownIcon className="h-4 w-4 text-[var(--color-muted)]" />
                        </motion.div>
                    </button>
                </section>
            }
        >
            
            <motion.div 
                    key="content"
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className=" border border-[var(--color-border)] px-2 bg-[var(--color-page)] rounded-xl shadow-md"
                >
                <div className="py-3">
                    {children}
                </div>
            </motion.div>

        </FloatingPopover>
        
           
           
       
    )
}
