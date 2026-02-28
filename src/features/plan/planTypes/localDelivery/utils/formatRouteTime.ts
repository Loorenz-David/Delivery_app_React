export const formatRouteTime = (
  value?: string | null,
  planStartDate?: string | 'today' | null,
  fallback: string = '--',
) => {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  const timePart = parsed.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (!planStartDate) return timePart

  let planDate = new Date() 
  if(planStartDate !== 'today'){
    planDate = new Date(planStartDate)
  }

  if (Number.isNaN(planDate.getTime())) return timePart

  const sameDay =
    parsed.getUTCFullYear() === planDate.getUTCFullYear() &&
    parsed.getUTCMonth() === planDate.getUTCMonth() &&
    parsed.getUTCDate() === planDate.getUTCDate()
  
  if(sameDay && planStartDate === 'today'){
    return `Today - ${timePart}`
  }
  
  if (sameDay) return timePart

  const datePart = parsed.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  })

  return `${datePart} - ${timePart}`
}
