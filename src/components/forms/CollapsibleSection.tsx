import { cn } from '../../lib/utils/cn'
import { useState } from 'react'

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
                <span className="text-base font-semibold text-[var(--color-text)]">{title}</span>
                <ChevronDownIcon
                    className={cn(
                        'app-icon h-4 w-4 text-[var(--color-muted)] transition-transform',
                        isOpen ? 'rotate-180' : 'rotate-0',
                    )}
                />
            </button>
            {isOpen && <div className="border-t border-[var(--color-border)] px-4 py-4">{children}</div>}
        </section>
    )
}
