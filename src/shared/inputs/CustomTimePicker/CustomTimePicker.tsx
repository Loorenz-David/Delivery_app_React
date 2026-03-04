import { useEffect, useMemo } from 'react'

import {
  HOURS_12,
  HOURS_24,
  PERIODS,
  type Period,
  type PickerFormat,
} from './types'
import { minuteValuesByStep } from './utils/timeClamp'
import { parseHHmm, to12HourParts, to2 } from './utils/timeFormat'
import { useTimePickerState } from './hooks/useTimePickerState'
import { useSegmentedTimeInput } from './hooks/input/useSegmentedTimeInput'
import { TimeInputField } from './components/TimeInputField'
import { TimePickerPopover } from './components/TimePickerPopover'
import { TimeColumn } from './components/TimeColumn'
import { PickerFooter } from './components/PickerFooter'

type CustomTimePickerProps = {
  selectedTime: string | null | undefined
  onChange: (value: string) => void
  format?: PickerFormat
  disabled?: boolean
  minuteStep?: number
  className?: string
  popoverWidth?: number
  popoverHeight?: number
  closeOnDone?: boolean
}

export const CustomTimePicker = ({
  selectedTime,
  onChange,
  format = '24h',
  disabled = false,
  minuteStep = 1,
  className,
  popoverWidth = 320,
  popoverHeight = 260,
  closeOnDone = true,
}: CustomTimePickerProps) => {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    if (!selectedTime) {
      return
    }

    if (!parseHHmm(selectedTime)) {
      // eslint-disable-next-line no-console
      console.warn('CustomTimePicker received invalid time', selectedTime)
    }
  }, [selectedTime])

  const {
    open,
    setOpen,
    draft,
    setDraftHour,
    setDraftMinute,
    setDraftPeriod,
    beginInteraction,
    cancel,
    done,
  } = useTimePickerState({
    selectedTime,
    minuteStep,
    closeOnDone,
  })

  const minuteValues = useMemo(() => minuteValuesByStep(minuteStep), [minuteStep])
  const draft12 = useMemo(() => to12HourParts(draft), [draft])

  const segmentedInput = useSegmentedTimeInput({
    format,
    minuteStep,
    value: draft,
    onChangeHour24: setDraftHour,
    onChangeMinute: setDraftMinute,
    onChangePeriod: setDraftPeriod,
    onCancel: cancel,
    onDone: () => {
      const normalized = done()
      onChange(normalized || '')
    },
  })

  const closeWithCancel = (nextOpen: boolean) => {
    if (disabled) {
      return
    }

    if (nextOpen) {
      beginInteraction()
      return
    }

    cancel()
  }

  const handleDone = () => {
    const normalized = done()
    onChange(normalized || '')
    if (!closeOnDone) {
      setOpen(true)
    }
  }

  const inputReference = (
    <TimeInputField
      value={segmentedInput.displayValue}
      disabled={disabled}
      className={className}
      onOpen={() => {
        if (!open) {
          beginInteraction()
        }
      }}
      onFocus={(input) => segmentedInput.onFocus(input)}
      onClick={(input, caret) => segmentedInput.onClick(input, caret)}
      onKeyDown={segmentedInput.onKeyDown}
    />
  )

  return (
    <TimePickerPopover
      open={open}
      onOpenChange={closeWithCancel}
      reference={inputReference}
      width={popoverWidth}
      height={popoverHeight}
    >
      <div className="flex flex-col gap-3 p-3">
        <div className={`grid gap-2 ${format === '12h' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TimeColumn
            label="Hours"
            values={format === '12h' ? HOURS_12 : HOURS_24}
            value={format === '12h' ? draft12.hour : draft.hour}
            onChange={(nextHour) => {
              if (format === '12h') {
                const hour24 = draft12.period === 'PM' ? (nextHour % 12) + 12 : nextHour % 12
                setDraftHour(hour24)
                return
              }
              setDraftHour(nextHour)
            }}
            formatter={(entry) => to2(entry)}
          />

          <TimeColumn
            label="Minutes"
            values={minuteValues}
            value={draft.minute}
            onChange={(nextMinute) => setDraftMinute(nextMinute)}
            formatter={(entry) => to2(entry)}
          />

          {format === '12h' ? (
            <TimeColumn
              label="Period"
              values={[0, 1]}
              value={draft12.period === 'AM' ? 0 : 1}
              onChange={(next) => setDraftPeriod(next === 0 ? 'AM' : 'PM')}
              formatter={(entry) => PERIODS[entry] as Period}
            />
          ) : null}
        </div>
      </div>

      <PickerFooter onCancel={cancel} onDone={handleDone} />
    </TimePickerPopover>
  )
}
