import { useMemo, useState } from 'react'

import {
  type CalendarRangeValue,
  type CalendarValue,
  getCalendarDayKey,
  useCalendarModel,
} from '@/shared/calendar'

import { useOrderFormFormSlice } from '../../context/OrderFormForm.context'
import { useOrderFormMetaSlice } from '../../context/OrderFormMeta.context'
import {
  expandCalendarSelectionToLocalDates,
  resolveOrderFormTimeZone,
  type DeliveryWindowDisplayRow,
  toDeliveryWindowDisplayRows,
} from '../../flows/orderFormDeliveryWindows.flow'
import { doesDeliveryWindowMatchRow, useDeliveryWindowCalendarActions } from './DeliveryWindowCalendar.action'
import {
  formatSelectionRange,
  isDeliveryWindowSelectionInProgress,
  resolveDefaultTimesForSelection,
} from './DeliveryWindowCalendar.flow'
import { DeliveryWindowCalendarCalendar } from './DeliveryWindowCalendarCalendar'
import { useDeliveryWindowCalendarDayPopoverActions, type DeliveryWindowCalendarDayPopoverState } from './DeliveryWindowCalendarDayPopover.action'
import { groupDeliveryWindowsByLocalDate } from './DeliveryWindowCalendarDayWindows.flow'
import { DeliveryWindowCalendarEditor } from './DeliveryWindowCalendarEditor'
import { DeliveryWindowCalendarModeSelector } from './DeliveryWindowCalendarModeSelector'
import type { DeliveryWindowCalendarMode } from './DeliveryWindowCalendar.types'
import { DeliveryWindowCalendarWindowsList } from './DeliveryWindowCalendarWindowsList'
import { MAX_ORDER_DELIVERY_WINDOWS } from '../../flows/orderFormDeliveryWindows.flow'

const isDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

export const OrderFormDeliveryWindowCalendar = ({ compact = false }: { compact?: boolean }) => {
  const [mode, setMode] = useState<DeliveryWindowCalendarMode>('range')
  const [selectionValue, setSelectionValue] = useState<CalendarValue>(null)
  const [manualEditorDates, setManualEditorDates] = useState<string[] | null>(null)
  const [editingWindow, setEditingWindow] = useState<DeliveryWindowDisplayRow | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activePopover, setActivePopover] = useState<DeliveryWindowCalendarDayPopoverState | null>(null)

  const { formState, formSetters } = useOrderFormFormSlice()
  const { meta } = useOrderFormMetaSlice()
  const timeZone = useMemo(() => resolveOrderFormTimeZone(), [])
  const operatingHours = meta.selectedCostumer?.operating_hours ?? []

  const selectedLocalDates = useMemo(
    () =>
      expandCalendarSelectionToLocalDates({
        mode,
        value: selectionValue as Date | Date[] | { start: Date | null; end: Date | null } | null,
        timeZone,
      }),
    [mode, selectionValue, timeZone],
  )

  const editorLocalDates = manualEditorDates ?? selectedLocalDates

  const calendarModel = useCalendarModel({
    selectionMode: mode,
    value: selectionValue,
    onChange: (nextValue) => {
      setSelectionValue(nextValue)
      setMessage(null)
      setActivePopover(null)
      setManualEditorDates(null)

      const nextSelectedDates = expandCalendarSelectionToLocalDates({
        mode,
        value: nextValue as Date | Date[] | { start: Date | null; end: Date | null } | null,
        timeZone,
      })

      if (!nextSelectedDates.length) {
        return
      }

      const defaults = resolveDefaultTimesForSelection({
        localDates: nextSelectedDates,
        operatingHours,
      })

      setStartTime(defaults.startTime)
      setEndTime(defaults.endTime)
      setIsEditorOpen(true)
    },
  })

  const displayRows = useMemo(
    () => toDeliveryWindowDisplayRows(formState.delivery_windows, timeZone),
    [formState.delivery_windows, timeZone],
  )

  const windowsByDate = useMemo(() => groupDeliveryWindowsByLocalDate(displayRows), [displayRows])

  const isPopoverBlocked = isDeliveryWindowSelectionInProgress({
    mode,
    selectionValue,
    isEditorOpen,
  })

  const {
    openWindowsPopover,
    openClosedWarningPopover,
    scheduleClose,
    clearCloseTimer,
    closePopoverNow,
  } = useDeliveryWindowCalendarDayPopoverActions({
    isBlocked: isPopoverBlocked,
    setActivePopover,
  })

  const helperText = useMemo(() => {
    if (mode === 'single') {
      const singleValue =
        selectionValue && !Array.isArray(selectionValue) && isDate(selectionValue) ? selectionValue : null
      return singleValue ? `Selected date: ${getCalendarDayKey(singleValue)}` : 'Select one date.'
    }

    if (mode === 'multiple') {
      if (!selectedLocalDates.length) {
        return 'Select one or more dates.'
      }
      return `Selected dates: ${selectedLocalDates.join(', ')}`
    }

    const rangeCandidate =
      selectionValue &&
      typeof selectionValue === 'object' &&
      !Array.isArray(selectionValue) &&
      'start' in selectionValue
        ? (selectionValue as CalendarRangeValue)
        : { start: null, end: null }

    return `Selected range: ${formatSelectionRange(rangeCandidate)}`
  }, [mode, selectedLocalDates, selectionValue])

  const baseWindowsForApply = useMemo(() => {
    if (!editingWindow) {
      return formState.delivery_windows
    }

    return formState.delivery_windows.filter(
      (window) => !doesDeliveryWindowMatchRow(window, editingWindow),
    )
  }, [editingWindow, formState.delivery_windows])

  const { applySelection, clearAllWindows, removeWindow } = useDeliveryWindowCalendarActions({
    localDates: editorLocalDates,
    startTime,
    endTime,
    existingWindows: baseWindowsForApply,
    operatingHours,
    timeZone,
    onApply: formSetters.handleDeliveryWindows,
    onCloseEditor: () => {
      setIsEditorOpen(false)
      setManualEditorDates(null)
      setEditingWindow(null)
    },
    onResetSelection: () => setSelectionValue(null),
    onMessage: setMessage,
  })

  const handleAddWindowForDate = (localDate: string) => {
    setActivePopover(null)
    setEditingWindow(null)
    setManualEditorDates([localDate])
    const defaults = resolveDefaultTimesForSelection({
      localDates: [localDate],
      operatingHours,
    })
    setStartTime(defaults.startTime)
    setEndTime(defaults.endTime)
    setIsEditorOpen(true)
  }

  const handleEditWindow = (row: DeliveryWindowDisplayRow) => {
    setActivePopover(null)
    setSelectionValue(null)
    setEditingWindow(row)
    setManualEditorDates([row.date])
    setStartTime(row.start)
    setEndTime(row.end)
    setIsEditorOpen(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <DeliveryWindowCalendarModeSelector
        mode={mode}
        onChangeMode={(nextMode) => {
          setMode(nextMode)
          setSelectionValue(null)
          setManualEditorDates(null)
          setActivePopover(null)
        }}
      />

      <DeliveryWindowCalendarCalendar
        model={calendarModel}
        operatingHours={operatingHours}
        timeZone={timeZone}
        windowsByDate={windowsByDate}
        activePopover={activePopover}
        onOpenWindowsPopover={openWindowsPopover}
        onOpenClosedWarningPopover={openClosedWarningPopover}
        onScheduleClosePopover={scheduleClose}
        onKeepPopoverOpen={clearCloseTimer}
        onClosePopoverNow={closePopoverNow}
        onAddWindowForDate={handleAddWindowForDate}
        onRemoveWindow={removeWindow}
        onEditWindow={handleEditWindow}
        isPopoverBlocked={isPopoverBlocked}
        disableAddWindow={formState.delivery_windows.length >= MAX_ORDER_DELIVERY_WINDOWS}
      />

      <DeliveryWindowCalendarEditor
        isOpen={isEditorOpen}
        selectedLocalDates={editorLocalDates}
        startTime={startTime}
        endTime={endTime}
        onChangeStartTime={setStartTime}
        onChangeEndTime={setEndTime}
        onCancel={() => {
          setIsEditorOpen(false)
          setManualEditorDates(null)
          setEditingWindow(null)
        }}
        onApply={applySelection}
      />

      <DeliveryWindowCalendarWindowsList
        rows={displayRows}
        onClearAll={clearAllWindows}
        onRemove={removeWindow}
        onEdit={handleEditWindow}
      />

      <p className={`text-[var(--color-muted)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {message ?? helperText}
      </p>
    </div>
  )
}
