import { useEffect, useMemo, useRef, useState } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { formatDateLabel } from '../section_panels/RoutesSection'
import { RouteCard } from './RouteCard'
import type { RoutePayload } from '../../types/backend'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { getDayLabels, buildCalendarMatrix, formatMonthLabel } from './utils/calendarHelpers'

interface CalendarRoutesViewProps {
  routes: RoutePayload[]
  onSelectRoute: (route: RoutePayload) => void
  onRouteDrop: (route: RoutePayload, event: React.DragEvent) => void
  onDateDrop: (dateKey: string, routes: RoutePayload[], event: React.DragEvent) => void
}

const getRouteOrdersCount = (route: RoutePayload) => route.total_orders ?? route.delivery_orders?.length ?? 0

const getRouteItemsCount = (route: RoutePayload) =>
  route.total_items ??
  route.delivery_orders?.reduce((sum, order) => sum + (order.delivery_items?.length ?? 0), 0) ??
  0

const STORAGE_KEY = 'calendar-routes-view:badge-toggles'

export function CalendarRoutesView({ routes, onSelectRoute, onRouteDrop, onDateDrop }: CalendarRoutesViewProps) {
  const isMobile = useResourceManager('isMobileObject')
  const popupManager = useResourceManager('popupManager')
  const [referenceDate, setReferenceDate] = useState(() => {
    const today = new Date()
    today.setDate(1)
    return today
  })
  const selectedDateRef = useRef<string>('')
  const [isNarrow, setIsNarrow] = useState(false)
  const [badgePrefs, setBadgePrefs] = useState(() => {
    if (typeof window === 'undefined') return { showOrders: true, showItems: true }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return { showOrders: false, showItems: false }
      const parsed = JSON.parse(stored)
      return {
        showOrders: parsed.showOrders ?? false,
        showItems: parsed.showItems ?? false,
      }
    } catch (error) {
      console.warn('Failed to read calendar badge preference', error)
      return { showOrders: false, showItems: false }
    }
  })
  const { showOrders, showItems } = badgePrefs
  const [popover, setPopover] = useState<{
    dateKey: string
    routes: RoutePayload[]
    position: { top: number; left: number; width: number }
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollInterval = useRef<number | null>(null)
  const hoverPopoverTimeout = useRef<number | null>(null)
  const popoverTriggerRef = useRef<HTMLElement | null>(null)
  const dayLabels = useMemo(() => getDayLabels(), [])
  const matrix = useMemo(() => buildCalendarMatrix(referenceDate, routes), [referenceDate, routes])
  const todayKey = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])


  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0
      setIsNarrow(width < 500)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(badgePrefs))
    } catch (error) {
      console.warn('Failed to persist calendar badge preference', error)
    }
  }, [badgePrefs])

  const handlePrevMonth = () => {
    const next = new Date(referenceDate)
    next.setMonth(referenceDate.getMonth() - 1)
    setReferenceDate(next)
  }

  const handleNextMonth = () => {
    const next = new Date(referenceDate)
    next.setMonth(referenceDate.getMonth() + 1)
    setReferenceDate(next)
  }

  const isOrderDrag = (event: React.DragEvent) =>
    event.dataTransfer?.types?.includes('application/x-order-transfer')

  const clearHoverPopoverTimeout = () => {
    if (hoverPopoverTimeout.current != null) {
      window.clearTimeout(hoverPopoverTimeout.current)
      hoverPopoverTimeout.current = null
    }
  }

  const openPopover = (cell: { dateKey: string; routes: RoutePayload[] }, target: HTMLElement) => {
    if (!containerRef.current) return
    popoverTriggerRef.current = target
    const bounds = containerRef.current.getBoundingClientRect()
    const targetBounds = target.getBoundingClientRect()
    const maxWidth = Math.min(360, bounds.width - 16)
    const approxHeight = 320
    const preferredLeft = targetBounds.left - bounds.left + targetBounds.width / 2 - maxWidth / 2
    const left = Math.max(8, Math.min(preferredLeft, bounds.width - maxWidth - 8))
    let top = targetBounds.bottom - bounds.top + 8
    if (top + approxHeight > bounds.height) {
      const above = targetBounds.top - bounds.top - approxHeight - 8
      if (above > 0) {
        top = above
      } else {
        top = Math.max(8, bounds.height - approxHeight - 8)
      }
    }
    setPopover({
      dateKey: cell.dateKey,
      routes: cell.routes,
      position: {
        top,
        left,
        width: maxWidth,
      },
    })
  }

  const handleDateClick = (cell: { dateKey: string; routes: RoutePayload[] }, event: React.MouseEvent) => {
    selectedDateRef.current = cell.dateKey 
    if (!cell.routes.length) {
      popupManager.open({ key: 'FillRoute', payload: { mode: 'create', deliveryDate: cell.dateKey } })
      return
    }
    if (cell.routes.length === 1) {
      onSelectRoute(cell.routes[0])
      return
    }
    openPopover(cell, event.currentTarget as HTMLElement)
  }

  const handleCellDragOver = (cell: { dateKey: string; routes: RoutePayload[] }, event: React.DragEvent) => {
    if (!isOrderDrag(event)) return
    event.preventDefault()
    if (cell.routes.length > 1) {
      schedulePopoverOpen(cell, event.currentTarget as HTMLElement)
    }
  }

  const handleCellDrop = (cell: { dateKey: string; routes: RoutePayload[] }, event: React.DragEvent) => {
    clearHoverPopoverTimeout()
    if (!isOrderDrag(event)) return
    if (cell.routes.length <= 1) {
      onDateDrop(cell.dateKey, cell.routes, event)
      return
    }
    // when multiple routes, rely on dropping on individual route cards
  }

  const schedulePopoverOpen = (cell: { dateKey: string; routes: RoutePayload[] }, target: HTMLElement) => {
    if (hoverPopoverTimeout.current != null) return
    hoverPopoverTimeout.current = window.setTimeout(() => {
      openPopover(cell, target)
      hoverPopoverTimeout.current = null
    }, 450)
  }

  const startScroll = (direction: 'up' | 'down') => {
    if (!scrollRef.current || scrollInterval.current != null) return
    scrollInterval.current = window.setInterval(() => {
      scrollRef.current?.scrollBy({
        top: direction === 'down' ? 12 : -12,
        behavior: 'smooth',
      })
    }, 40)
  }

  const stopScroll = () => {
    if (scrollInterval.current != null) {
      window.clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
  }

  useEffect(() => {
    if (!popover) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (popoverRef.current?.contains(target)) return
      setPopover(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [popover])

  useEffect(() => {
    if (!popover) {
      stopScroll()
      clearHoverPopoverTimeout()
    }
  }, [popover])

  useEffect(() => {
    if (!popover) return
    const handleGlobalDragOver = (event: DragEvent) => {
      const target = event.target as Node | null
      const isOrderDragEvent = event.dataTransfer?.types?.includes('application/x-order-transfer')
      if (!isOrderDragEvent) return
      const x = event.clientX
      const y = event.clientY
      const padding = 16
      const popRect = popoverRef.current?.getBoundingClientRect() ?? null
      const triggerRect = popoverTriggerRef.current?.getBoundingClientRect() ?? null
      const isWithinRect = (rect: DOMRect | null | undefined, pad = 0) =>
        rect ? x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad : false
      const overPopover = isWithinRect(popRect, padding)
      const overTrigger = isWithinRect(triggerRect, padding)
      let overConnector = false
      if (popRect && triggerRect) {
        const connector = {
          left: Math.min(popRect.left, triggerRect.left),
          right: Math.max(popRect.right, triggerRect.right),
          top: Math.min(popRect.top, triggerRect.bottom),
          bottom: Math.max(popRect.top, triggerRect.bottom),
        }
        overConnector = isWithinRect(connector as DOMRect, padding)
      }
      if (overPopover || overTrigger || overConnector || (target && (popoverRef.current?.contains(target) || popoverTriggerRef.current?.contains(target as HTMLElement)))) return
      setPopover(null)
      popoverTriggerRef.current = null
    }
    document.addEventListener('dragover', handleGlobalDragOver)
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver)
    }
  }, [popover])

  useEffect(() => () => clearHoverPopoverTimeout(), [])

  const handleClosePopover = () => {
    setPopover(null)
    popoverTriggerRef.current = null
  }

  return (
    <div className="relative space-y-3 " ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center  gap-2">
          <button
            type="button"
            className="rounded-full p-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-page)]"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="text-base flex flex-1 justify-center font-semibold text-[var(--color-text)]">{formatMonthLabel(referenceDate)}</p>
          <button
            type="button"
            className="rounded-full p-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-page)]"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-[var(--color-text)]">
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => setBadgePrefs((prev) => ({ ...prev, showOrders: !prev.showOrders }))}
          aria-pressed={showOrders}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${showOrders ? 'bg-neutral-400 border-neutral-400' : 'border-neutral-400 bg-white'}`}
          />
          <span className="font-medium">Show orders</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => setBadgePrefs((prev) => ({ ...prev, showItems: !prev.showItems }))}
          aria-pressed={showItems}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${showItems ? 'bg-neutral-200 border-neutral-200' : 'border-neutral-200 bg-white'}`}
          />
          <span className="font-medium">Show items</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-[var(--color-muted)]">
        {dayLabels.map((day) => (
          <div key={day} className="flex items-center justify-center py-2 font-semibold uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {matrix.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="contents">
            {week.map((cell) => {
              const totalOrders = showOrders ? cell.routes.reduce((sum, route) => sum + getRouteOrdersCount(route), 0) : 0
              const totalItems = showItems ? cell.routes.reduce((sum, route) => sum + getRouteItemsCount(route), 0) : 0
              const isToday = cell.dateKey === todayKey
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className={`relative flex min-h-[96px] flex-col rounded-xl border p-2 text-left transition hover:border-[var(--color-primary)] ${
                    cell.inCurrentMonth ? 'bg-white border-[var(--color-border)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]/60'
                  } 
                  ${cell.dateKey == selectedDateRef.current ? 'border-[var(--color-light-blue)] shadow-[0_0_10px_var(--color-light-blue)]/50' : ''}
                  `}
                  onClick={(event) => handleDateClick(cell, event)}
                  onDragOver={(event) => handleCellDragOver(cell, event)}
                  onDrop={(event) => handleCellDrop(cell, event)}
                  onDragLeave={clearHoverPopoverTimeout}
                >
                  <span
                    className={`flex items-center justify-center ${
                      isToday
                        ? 'bg-[var(--color-dark-blue)]/80 text-[var(--color-page)] ring-1s ring-[var(--color-primary)]/20'
                        : cell.inCurrentMonth
                          ? 'text-[var(--color-text)]'
                          : 'text-[var(--color-muted)]'
                    } ${isMobile.isMobile ? 
                      ` rounded-full text-[10px] font-semibold`
                      :`flex h-8 w-8  rounded-full text-sm font-semibold `}`}
                  >
                    {cell.label ?? ''}
                  </span>
                  {cell.routes.length ? (
                    <div className="mt-auto flex flex-wrap items-center gap-1">
                      <span className="inline-flex flex-1 min-h-[20px] items-center justify-center rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {isNarrow ? (
                          cell.routes.length
                        ) : (
                          <span className="text-[8px]">{`${cell.routes.length} route${cell.routes.length > 1 ? 's' : ''}`}</span>
                        )}
                      </span>
                      {showOrders ? (
                        <span className="inline-flex flex-1 min-h-[20px] items-center justify-center rounded-full bg-neutral-400 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {isNarrow ? (
                            totalOrders
                          ) : (
                            <span className="text-[8px]">{`${totalOrders} order${totalOrders === 1 ? '' : 's'}`}</span>
                          )}
                        </span>
                      ) : null}
                      {showItems ? (
                        <span className="inline-flex flex-1 min-h-[20px] items-center justify-center rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text)]">
                          {isNarrow ? (
                            totalItems
                          ) : (
                            <span className="text-[8px]">{`${totalItems} item${totalItems === 1 ? '' : 's'}`}</span>
                          )}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {/* {cell.routes.length && !isNarrow ? (
                    <div className="mt-2 hidden space-y-1 text-[11px] text-[var(--color-muted)] md:block">
                      {cell.routes.slice(0, 2).map((route) => (
                        <div key={route.id} className="truncate">
                          {route.route_label}
                        </div>
                      ))}
                      {cell.routes.length > 2 ? <div className="text-[10px] text-[var(--color-muted)]">+{cell.routes.length - 2} more</div> : null}
                    </div>
                  ) : null} */}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {popover ? (
        <div
          className="absolute z-10 max-w-[90vw] rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-xl"
          style={{
            top: popover.position.top,
            left: popover.position.left,
            width: popover.position.width,
          }}
          ref={popoverRef}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">{formatDateLabel(popover.dateKey)}</p>
            <div className="flex gap-2">
              <BasicButton
                params={{
                  variant: 'secondary',
                  onClick: handleClosePopover,
                }}
              >
                X
              </BasicButton>
            </div>
          </div>
          <div
          className="relative mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1"
          ref={scrollRef}
          onMouseLeave={stopScroll}
        >
            {popover.routes.map((route) => (
              <div
                key={route.id}
                className="transform scale-[0.95] cursor-pointer"
                onClick={() => {
                  setPopover(null)
                  onSelectRoute(route)
                }}
                onDragOver={(event) => {
                  if (isOrderDrag(event)) {
                    event.preventDefault()
                  }
                }}
                onDrop={(event) => {
                  if (!isOrderDrag(event)) return
                  onRouteDrop(route, event)
                  setPopover(null)
                }}
              >
                <RouteCard route={route} compact />
              </div>
            ))}
            {popover.routes.length > 3 ? (
              <>
                <div
                  className="pointer-events-auto absolute inset-x-0 bottom-0 h-6 cursor-s-resize bg-gradient-to-t from-white/80 to-transparent text-center text-[10px] text-[var(--color-muted)]"
                  onMouseEnter={() => startScroll('down')}
                  onMouseLeave={stopScroll}
                >
                  ▼
                </div>
                <div
                  className="pointer-events-auto absolute inset-x-0 top-0 h-6 cursor-n-resize bg-gradient-to-b from-white/80 to-transparent text-center text-[10px] text-[var(--color-muted)]"
                  onMouseEnter={() => startScroll('up')}
                  onMouseLeave={stopScroll}
                >
                  ▲
                </div>
              </>
            ) : null}
          </div>
          <div
            className="cursor-pointer mt-3 flex items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] p-2 text-sm text-[var(--color-text)]"
            onDragOver={(event) => {
              if (isOrderDrag(event)) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              if (!isOrderDrag(event)) return
              onDateDrop(popover.dateKey, [], event)
              setPopover(null)
            }}
            onClick={()=>{
              popupManager.open({
                key: 'FillRoute',
                payload: { mode: 'create', deliveryDate: popover.dateKey },
              })
            }}
          >
            + Route
          </div>
        </div>
      ) : null}
    </div>
  )
}
