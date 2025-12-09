export type OrderMarkerStatus = 'pending' | 'delivered' | 'failed'

const STATUS_COLORS: Record<OrderMarkerStatus, string> = {
  pending: '#fbbf24',
  delivered: '#10b981',
  failed: '#f87171',
}

interface MarkerContentOptions {
  label?: string
  status?: OrderMarkerStatus
  highlighted?: boolean
}

export function createOrderMarkerElement({ label, status = 'pending', highlighted }: MarkerContentOptions) {
  const container = document.createElement('div')
  container.className =
    'order-marker inline-flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white shadow-lg ring-2 ring-white/80'
  container.style.backgroundColor = highlighted ? '#2563eb' : STATUS_COLORS[status]
  if (highlighted) {
    container.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.25)'
  }
  container.textContent = label ?? ''
  return container
}
