import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils/cn'

type ThreeDotMenuItem = {
  label: string
  value: string
  icon?: React.ReactNode
  action?: (item: ThreeDotMenuItem) => void
}

type ThreeDotMenuProps = {
  items: ThreeDotMenuItem[]
  selectedValue?: string | null
  onSelect?: (value: string) => void
  widthPx?: number
  className?: string
  menuClassName?: string
  buttonClassName?: string
}

const DEFAULT_WIDTH = 200
const DOT_SIZE = 4

export function ThreeDotMenu({
  items,
  selectedValue,
  onSelect,
  widthPx = DEFAULT_WIDTH,
  className,
  menuClassName,
  buttonClassName,
}: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const menuWidth = useMemo(() => Math.max(widthPx, 140), [widthPx])

  const closeMenu = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeMenu, isOpen])

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center justify-center gap-1 shadow-xs rounded-full border border-[var(--color-border)]/80 px-3 py-3 transition hover:bg-[var(--color-accent)] focus:outline-none',
          buttonClassName,
        )}
      >
        <span
          className="inline-block rounded-full bg-[var(--color-muted)]"
          style={{ width: DOT_SIZE, height: DOT_SIZE }}
        />
        <span
          className="inline-block rounded-full bg-[var(--color-muted)]"
          style={{ width: DOT_SIZE, height: DOT_SIZE }}
        />
        <span
          className="inline-block rounded-full bg-[var(--color-muted)]"
          style={{ width: DOT_SIZE, height: DOT_SIZE }}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-7  z-30 mt-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-2 shadow-lg',
            menuClassName,
          )}
          style={{ minWidth: menuWidth, maxWidth: menuWidth }}
        >
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--color-muted)]">No actions</div>
          ) : (
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const isSelected = item.value === selectedValue
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.action?.(item)
                      closeMenu()
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm  transition hover:bg-[var(--color-accent)] ',
                      isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]',
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      {item.icon ? (
                        <span className={cn(isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]')}>
                          {item.icon}
                        </span>
                      ) : (
                        <span className="h-5 w-5" />
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
