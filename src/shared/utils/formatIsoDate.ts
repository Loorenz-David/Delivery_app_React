export const formatIsoDate = (value: string | null | undefined) => {
  if (!value) return null
  const [datePart] = value.split('T')
  return datePart || null
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_UNITS: Array<{
  unit: Intl.RelativeTimeFormatUnit
  seconds: number
}> = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
]

export const formatIsoDateRelative = (value: string | null | undefined) => {
  if (!value) return null

  const parsedTime = new Date(value).getTime()
  if (Number.isNaN(parsedTime)) return null

  const now = Date.now()
  const diffSeconds = Math.round((parsedTime - now) / 1000)

  if (Math.abs(diffSeconds) < 60) {
    return relativeTimeFormatter.format(0, 'second')
  }

  const unitConfig = RELATIVE_UNITS.find((entry) => Math.abs(diffSeconds) >= entry.seconds)
  if (!unitConfig) return relativeTimeFormatter.format(0, 'second')

  const amount = Math.round(diffSeconds / unitConfig.seconds)
  return relativeTimeFormatter.format(amount, unitConfig.unit)
}



export const getIsoWeekLabel = (dateInput?: string | null) => {
  if(!dateInput) return null
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'v --'

  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `v ${weekNo}`
}