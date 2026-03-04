import { useEffect, useMemo, useState } from 'react'

import { CustomDatePicker } from './CustomDatePicker'
import { CustomTimePicker } from './CustomTimePicker/index'

type CustomDateTimePickerProps = {
  date?: Date | null
  onChangeDate?: (value: string | null) => void
  selectedTime?: string | null
  onChangeTime?: (value: string | null) => void
}

export const CustomDateTimePicker = ({
  date,
  onChangeDate,
  selectedTime,
  onChangeTime,
}: CustomDateTimePickerProps) => {
  const isTimeControlled = selectedTime !== undefined && Boolean(onChangeTime)

  const [internalTime, setInternalTime] = useState<string | null>(() =>
    deriveTimeFromDate(date),
  )

  const resolvedTime = useMemo(
    () => (isTimeControlled ? selectedTime ?? null : internalTime),
    [internalTime, isTimeControlled, selectedTime],
  )

  useEffect(() => {
    if (isTimeControlled) return
    setInternalTime(deriveTimeFromDate(date))
  }, [date, isTimeControlled])

  const handleDateChange = (value: string | null) => {
    if (!value) {
      onChangeDate?.(null)
      return
    }

    const normalizedTime = normalizeTime(resolvedTime)
    if (!normalizedTime) {
      onChangeDate?.(value)
      return
    }

    const combined = new Date(`${value}T${normalizedTime}`)
    onChangeDate?.(Number.isNaN(combined.getTime()) ? value : combined.toISOString())
  }

  const handleTimeChange = (value: string | null) => {
    if (isTimeControlled) {
      onChangeTime?.(value)
    } else {
      setInternalTime(value)
    }

    if (!date) return
    const dateValue = formatDateOnly(date)

    const normalized = normalizeTime(value)
    if (!normalized) {
      onChangeDate?.(dateValue)
      return
    }

    const combined = new Date(`${dateValue}T${normalized}`)
    onChangeDate?.(Number.isNaN(combined.getTime()) ? dateValue : combined.toISOString())
  }

  const isTimeDisabled = !date

  return (
    <div className="custom-field-container custom-date-time-group flex items-center "

    >
      <style>
        {`
          .custom-date-time-group .custom-field-container {
            border: none;
            background: transparent;
            box-shadow: none;
            padding: 0;
            border-radius: 0;
          }
          .custom-date-time-group .custom-field-container:focus-within {
            background: transparent;
            box-shadow: none;
          }
        `}
      </style>
      <div className="flex-1 border-r-1 border-[var(--color-muted)]/30">
        <CustomDatePicker date={date} onChange={handleDateChange} />
      </div>

      <div className={isTimeDisabled ? 'flex-1 opacity-50 pointer-events-none' : 'flex-1'}>
        <CustomTimePicker
          selectedTime={resolvedTime}
          onChange={(value) => handleTimeChange(value || null)}
        />
      </div>
    </div>
  )
}

const deriveTimeFromDate = (value?: Date | null) => {
  if (!value) return null
  if (Number.isNaN(value.getTime())) return null
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const normalizeTime = (value: string | null | undefined) => {
  if (!value) return null
  const [hours = '00', minutes = '00', seconds = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

const formatDateOnly = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
