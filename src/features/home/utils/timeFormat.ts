export function formatTimeLabel(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed)
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  const timeOnly = value.match(/^(\d{1,2}):(\d{2})/)
  if (timeOnly) {
    const hours = Number(timeOnly[1])
    const minutes = Number(timeOnly[2])
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return `${pad(hours)}:${pad(minutes)}`
    }
  }
  return value
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}
