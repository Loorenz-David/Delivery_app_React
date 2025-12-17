import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { BackArrowIcon2} from '../../../../assets/icons'
import { BasicButton } from '../../../../components/buttons/BasicButton'

import {
  MobileSectionHeaderProvider,
  useMobileSectionHeader,
  type MobileHeaderAction,
} from '../../contexts/MobileSectionHeaderContext'

type DragDirection = 'up' | 'down' | null

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

interface MobileSectionSheetProps {
  sectionStack: ReactNode[]
  onOpenFilters: () => void
  onOpenSettings: () => void
  onProgressChange?: (progress: number) => void
}

export function MobileSectionSheet(props: MobileSectionSheetProps) {
  return (
    <MobileSectionHeaderProvider>
      <MobileSectionSheetContent {...props} />
    </MobileSectionHeaderProvider>
  )
}

function MobileSectionSheetContent({
  sectionStack,
  onOpenFilters,
  onOpenSettings,
  onProgressChange,
}: MobileSectionSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dimensions, setDimensions] = useState({ containerHeight: 0, headerHeight: 0 })
  const hasInitialized = useRef(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const headerContext = useMobileSectionHeader()
  const activeHeader = headerContext?.activeHeader
  const headerRef = headerContext?.headerRef ?? { current: null }

  const dragStartY = useRef(0)
  const dragLastY = useRef(0)
  const dragStartTranslate = useRef(0)
  const dragDirection = useRef<DragDirection>(null)
  const activePointerId = useRef<number | null>(null)

  const snapPoints = useMemo(() => {
    const height =
      dimensions.containerHeight || (typeof window !== 'undefined' ? window.innerHeight : 0)
    const headerHeight = dimensions.headerHeight || 64
    if (!height) return [0]

    const closed = Math.max(0, height - headerHeight)
    const quarterOpen = Math.min(Math.max(0, height * 0.50), closed)
    return [0, quarterOpen, closed]
  }, [dimensions.containerHeight, dimensions.headerHeight])

  const getNearestSnap = useCallback(
    (value: number, direction: DragDirection) => {
      if (!snapPoints.length) return value
      const ordered = [...snapPoints].sort((a, b) => a - b)
      const [minSnap, maxSnap] = [ordered[0], ordered[ordered.length - 1]]

      const candidates =
        direction === 'up'
          ? ordered.filter((point) => point <= value)
          : direction === 'down'
            ? ordered.filter((point) => point >= value)
            : ordered

      const pool = candidates.length ? candidates : ordered
      let closest = pool[0]
      let smallestDelta = Math.abs(value - closest)

      for (let i = 1; i < pool.length; i += 1) {
        const delta = Math.abs(value - pool[i])
        if (delta < smallestDelta) {
          smallestDelta = delta
          closest = pool[i]
        }
      }

      return clamp(closest, minSnap, maxSnap)
    },
    [snapPoints],
  )

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (menuButtonRef.current?.contains(target) || menuRef.current?.contains(target))) {
        return
      }
      setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleClickAway)
    return () => document.removeEventListener('pointerdown', handleClickAway)
  }, [isMenuOpen])

  useEffect(() => {
    const measure = () => {
      const nextHeight = containerRef.current?.getBoundingClientRect().height ?? 0
      const nextHeaderHeight = headerContext?.getHeaderHeight() ?? 64

      setDimensions((prev) => {
        if (prev.containerHeight === nextHeight && prev.headerHeight === nextHeaderHeight) {
          return prev
        }
        return { containerHeight: nextHeight, headerHeight: nextHeaderHeight }
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (!snapPoints.length) return
    setTranslateY((current) => {
      if (!hasInitialized.current) {
        hasInitialized.current = true
        return snapPoints[1] ?? snapPoints[0]
      }
      const [minSnap, maxSnap] = [snapPoints[0], snapPoints[snapPoints.length - 1]]
      const clamped = clamp(current, minSnap, maxSnap)
      return getNearestSnap(clamped, null)
    })
  }, [getNearestSnap, snapPoints])

  useEffect(() => {
    if (!onProgressChange || !snapPoints.length) {
      return
    }
    const maxSnap = snapPoints[snapPoints.length - 1] ?? 1
    const progress = maxSnap > 0 ? 1 - clamp(translateY / maxSnap, 0, 1) : 1
    onProgressChange(progress)
  }, [onProgressChange, snapPoints, translateY])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as HTMLElement)?.closest('button')) return

    activePointerId.current = event.pointerId
    dragStartY.current = event.clientY
    dragLastY.current = event.clientY
    dragStartTranslate.current = translateY
    dragDirection.current = null
    setIsDragging(true)

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || activePointerId.current !== event.pointerId) return
    const maxSnap = snapPoints[snapPoints.length - 1] ?? 0
    const deltaY = event.clientY - dragStartY.current
    const nextTranslate = clamp(dragStartTranslate.current + deltaY, 0, maxSnap)

    const incrementalDelta = event.clientY - dragLastY.current

    if (Math.abs(incrementalDelta) > 0.5) {
      dragDirection.current = incrementalDelta > 0 ? 'down' : 'up'
      dragLastY.current = event.clientY
    }

    setTranslateY(nextTranslate)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || activePointerId.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)

    setTranslateY((current) => getNearestSnap(current, dragDirection.current))
    activePointerId.current = null
  }

  const handleBack = () => {
    if (!activeHeader) return
    headerContext?.popHeader()
    activeHeader.onBack?.()
  }

  const menuActions: MobileHeaderAction[] | [] = useMemo(() => {
    if (activeHeader?.menuActions?.length) {
      return activeHeader.menuActions
    }
    return [
      
    ]
  }, [activeHeader?.menuActions, onOpenFilters, onOpenSettings])

  const renderMenu = () => {
    if (!isMenuOpen) return null
    return (
      <div
        ref={menuRef}
        className="absolute right-2 top-[calc(100%+8px)] z-10 w-60 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-xl"
      >
        {menuActions.map((action, index) => (
          <button
            key={`${action.label}-${index}`}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-accent)]"
            onClick={(event) => {
              event.stopPropagation()
              setIsMenuOpen(false)
              action.onClick?.()
            }}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center text-[var(--color-muted)]">
              {action.icon ?? <span className="inline-flex h-6 w-6" />}
            </span>
            <span className="flex-1 truncate">{action.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed h-screen inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-white shadow-2xl"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 220ms ease-out',
        willChange: 'transform',
      }}
    >
      <header
        ref={headerRef}
        className="cursor-grab border-b border-[var(--color-border)] px-4 pt-3 pb-2 active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="relative flex items-center justify-between gap-3 min-h-[40px]">
          { activeHeader?.onBack &&
            <BasicButton
              params={{
                variant: 'rounded',
                onClick: handleBack,
                disabled: !activeHeader?.onBack,
                ariaLabel: 'Go back',
              }}
            >
              <BackArrowIcon2 className="app-icon-dark h-5 w-5 text-[var(--color-text)]" />
            </BasicButton>

          }

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-center text-base font-semibold text-[var(--color-text)]">
              {activeHeader?.title ?? 'Sections'}
            </p>
          </div>

          {menuActions.length > 0 && 
          <BasicButton
            ref={menuButtonRef}
            params={{
              variant: 'rounded',
              onClick: () => setIsMenuOpen((prev) => !prev),
              ariaLabel: 'Open menu',
            }}
          >
            <div className="flex flex-col items-center justify-center gap-[3px] text-[#383838]">
              <span className="h-[3px] w-[3px] rounded-full bg-current" />
              <span className="h-[3px] w-[3px] rounded-full bg-current" />
              <span className="h-[3px] w-[3px] rounded-full bg-current" />
            </div>
          </BasicButton>
          }
          {renderMenu()}
        </div>

        {activeHeader?.secondaryContent ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--color-accent)]/60 px-3 py-2 text-sm text-[var(--color-text)]">
            {activeHeader.secondaryContent}
          </div>
        ) : null}
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full  pb-4">
          {sectionStack.length > 0 ? (
            <div className="relative flex flex-col gap-3 pb-3">{sectionStack}</div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-5">
              <p className="text-sm text-[var(--color-muted)]">Open a route or order to see more details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
