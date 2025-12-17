export type OrderMarkerStatus = 'pending' | 'delivered' | 'failed' | 'default'

const STATUS_COLORS: Record<OrderMarkerStatus, string> = {
  pending: '#fbbf24',
  delivered: '#10b981',
  failed: '#f87171',
  default: '#ffffffff',
}

interface MarkerContentOptions {
  label?: string
  status?: OrderMarkerStatus
  highlighted?: boolean
  color?: string | null
}

export function createOrderMarkerElement({ label, status = 'pending', highlighted, color }: MarkerContentOptions) {
  const container = document.createElement('div')
  container.className =
    'order-marker inline-flex h-7 w-7 items-center justify-center rounded-md font-semibold text-white shadow-lg '
  const baseColor = color ?? STATUS_COLORS[status]

  if (status === 'default') {
    container.style.border = `1px solid rgba(63, 125, 247, 1)`
    container.style.color = 'rgba(63, 125, 247, 1)'
  }
  
  container.style.backgroundColor = highlighted ? '#2563eb' : baseColor
  if (highlighted) {
    container.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.25)'
  }
  container.textContent = label ?? ''
  return container
}
