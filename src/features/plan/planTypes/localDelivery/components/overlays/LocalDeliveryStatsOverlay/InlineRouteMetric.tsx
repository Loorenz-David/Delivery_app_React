type InlineRouteMetricProps = {
  label: string
  value: string
}

export const InlineRouteMetric = ({ label, value }: InlineRouteMetricProps) => (
  <div className="flex min-h-[52px] flex-col justify-between rounded-2xl bg-white/6 px-3 py-2 text-white">
    <span className="text-sm font-semibold">{value || '—'}</span>
    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/68">
      {label || ' '}
    </span>
  </div>
)
