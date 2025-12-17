import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, Dispatch, SetStateAction } from 'react'

import { cn } from '../../lib/utils/cn'
import { ChevronDownIcon } from '../../assets/icons'

interface DropDownOption {
  value: any
  display: ReactNode
}

interface DropDownProps {
  options: DropDownOption[]
  placeholder?: string
  backgroundColor?: string
  className?: string
  buttonClassName?: string
  /**
   * Provide a state tuple when you want DropDown to control an external useState hook.
   */
  state?: [any | undefined, Dispatch<SetStateAction<any | undefined>>]
  /**
   * Provide a ref when you want DropDown to write the selected value into a mutable ref.
   */
  valueRef?: React.RefObject<any>
  onChange?: (value: any, isOpen:Dispatch<SetStateAction<boolean>>) => void,
  staticIcon?:ReactNode
}

const defaultButtonStyle = "gap-2 items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"

export function DropDown({
  options,
  placeholder = 'Select an option',
  backgroundColor = 'transparent',
  className,
  buttonClassName = defaultButtonStyle,
  state,
  valueRef,
  onChange,
  staticIcon
}: DropDownProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [internalValue, setInternalValue] = useState<string | undefined>(() => state?.[0] ?? valueRef?.current)
  const [isOpen, setIsOpen] = useState(false)

  const selectedValue = state ? state[0] : valueRef ? valueRef.current : internalValue
  const closeMenu = useCallback(() => {
    setIsOpen(false)
    requestAnimationFrame(() => setIsOpen(false))
  }, [])

  useEffect(() => {
    closeMenu()
  }, [closeMenu, selectedValue])

  const closeOnOutsideClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return
    if (!containerRef.current.contains(event.target as Node)) {
      closeMenu()
    }
  }, [closeMenu])

  const closeOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  }, [closeMenu])

  useEffect(() => {
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeOnEscape, closeOnOutsideClick])

  useEffect(() => {
    if (!isOpen) return
    const handleFocus = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [closeMenu, isOpen])


  const handleSelect = (value: string) => {
    if (state) {
      state[1](value)
    } else if (valueRef) {
      valueRef.current = value
    } else {
      setInternalValue(value)
    }
    closeMenu()
    onChange?.(value,setIsOpen)
    
    
  }
  const selectedOption = useMemo(() => options.find((option) => option.value === selectedValue), [options, selectedValue])

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full text-sm', className)}
      style={{ backgroundColor }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={cn(`flex h-full w-full `, buttonClassName)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{ backgroundColor }}
      >
        {staticIcon && staticIcon}
        <span className={cn('truncate text-left flex-1', !selectedOption && 'text-[var(--color-muted)] ')}>
          {selectedOption?.display ?? placeholder}
        </span>
       
        <ChevronDownIcon className={cn('app-icon pointer-events-none h-4 w-4 text-[var(--color-muted)] transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <ul
          className="absolute left-0 top-[calc(100%+4px)] z-10 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue
            return (
              <li
                key={option.value}
                onClick={(e) => {e.stopPropagation(); handleSelect(option.value)}}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-accent)]',
                  isSelected && 'font-medium text-[var(--color-text)]'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <span className="flex-1 truncate">{option.display}</span>
                <span className={cn('text-[var(--color-primary)]', !isSelected && 'text-transparent')}>
                  ✓
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
