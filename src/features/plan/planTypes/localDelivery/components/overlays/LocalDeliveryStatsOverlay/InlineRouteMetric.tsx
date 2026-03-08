type InlineRouteMetricProps = {
  label: string
  value: string
}

export const InlineRouteMetric = ({ label, value }: InlineRouteMetricProps) => (
  <div className="flex items-center gap-2 text-sm text-white">
    <span className="text-sm font-semibold">{value}</span>
    <span className="text-sm font-medium text-white/78">{label}</span>
  </div>
)
