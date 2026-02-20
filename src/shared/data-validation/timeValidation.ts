import { validateString } from './stringValidation'



type ValidComparisons = 
  | 'end_greater_than_start'
  | 'are_equal_dates'

export const validateDateComparison = (startDate:string, endDate:string, comparison:ValidComparisons = 'end_greater_than_start') => {
    if (!validateString(startDate) || !validateString(endDate)) {
        return false
    }
    const start = startDate.split('T')[0]
    const end = endDate.split('T')[0]
    if (comparison == "end_greater_than_start"){
      return end >= start
    }
    else if (comparison == 'are_equal_dates'){
      return end == start
    }
    return false
  }


export const validateDateTimeComparison = (
  startDate: string | null,
  startTime: string | null,
  endDate: string | null,
  endTime: string | null
) => {

  if (
    !validateString(startTime) ||
    !validateString(endTime)
  ) {
    return true
  }


  const startDateTime = mergeDateAndTime(startDate ?? '', startTime ?? '')
  const endDateTime = mergeDateAndTime(endDate ?? '', endTime ?? '')

  return  endDateTime >= startDateTime
}

export const mergeDateAndTime = (isoDate: string, time: string) => {
  const [hours, minutes] = time.split(':').map(Number)

  const date = isoDate ? new Date(isoDate) : new Date()


  date.setHours(hours, minutes, 0, 0)
  return date
}

export const toDateOnly = (value: string | Date | null) => {
  if(!value){
    return ''
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return ''
    }
    return value.toISOString().slice(0, 10)
  }

  if (!validateString(value)) {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.split(/[T\s]/)[0]
}

export const applyTimezone = (value: string | Date, timeZone?: string) => {
  if (!timeZone) {
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value
  const year = getPart('year')
  const month = getPart('month')
  const day = getPart('day')
  const hour = getPart('hour')
  const minute = getPart('minute')
  const second = getPart('second')

  if (!year || !month || !day || !hour || !minute || !second) {
    return null
  }

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
}

export const coerceUtcFromOffset = (value: string | Date) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }
    return new Date(
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds(),
      ),
    )
  }

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[T\\s](\d{2}:\d{2}:\d{2})(?:\\.(\\d+))?([+-]\\d{2}:\\d{2}|Z)?$/,
  )
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const [, datePart, timePart, milliPart] = match
  const millis = milliPart ? milliPart.padEnd(3, '0').slice(0, 3) : '000'

  return new Date(`${datePart}T${timePart}.${millis}Z`)
}
