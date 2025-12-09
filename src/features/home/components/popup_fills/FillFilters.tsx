import { useEffect, useMemo, useState } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { PhoneField } from '../../../../components/forms/PhoneField'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import type { RoutesPack, RoutePayload } from '../../types/backend'
import { MultiSelectDropDown } from '../../../../components/button/MultiSelectDropDown'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'

type ActiveTab = 'route' | 'order'

interface FillFiltersPayload {
  initialFilters: Record<string, any>
  onApply: (filters: Record<string, any>) => void
  onReset: () => void
}

interface MonthBucket {
  label: string
  start: Date
  end: Date
  count: number
}

function formatDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatMonthLabel(date: Date) {
  return `${date.toLocaleString(undefined, { month: 'short' })} ${String(date.getFullYear()).slice(-2)}`
}

function clampRange(start: Date, end: Date, maxMonths = 12) {
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (diffMonths > maxMonths) {
    const clampedEnd = new Date(start)
    clampedEnd.setMonth(start.getMonth() + maxMonths)
    return [start, clampedEnd] as const
  }
  return [start <= end ? start : end, end >= start ? end : start] as const
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31)
}

function clampToYear(date: Date, yearStart: Date, yearEnd: Date) {
  if (date < yearStart) return new Date(yearStart)
  if (date > yearEnd) return new Date(yearEnd)
  return date
}

function addMonthsSafe(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function monthsDiff(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}

function buildOrderFiltersFromInitial(initialFilters: Record<string, any>) {
  const unwrapString = (val: any) => {
    if (typeof val === 'string') return val.replace(/%/g, '')
    return ''
  }
  const unwrapPhone = (val: any) => {
    if (val && typeof val === 'object') {
      return {
        prefix: typeof val.prefix === 'string' ? val.prefix : '',
        number: typeof val.number === 'string' ? val.number : '',
      }
    }
    if (typeof val === 'string') {
      return { prefix: '', number: val.replace(/%/g, '') }
    }
    return { prefix: '', number: '' }
  }

  return {
    client_first_name: unwrapString(initialFilters?.['delivery_orders.client_first_name']?.value),
    client_last_name: unwrapString(initialFilters?.['delivery_orders.client_last_name']?.value),
    client_email: unwrapString(initialFilters?.['delivery_orders.client_email']?.value),
    client_primary_phone: unwrapPhone(initialFilters?.['delivery_orders.client_primary_phone']?.value),
    client_secondary_phone: unwrapPhone(initialFilters?.['delivery_orders.client_secondary_phone']?.value),
    client_address: unwrapString(initialFilters?.['delivery_orders.client_address']?.value),
  }
}

export default function FillFilters({ payload, onClose }: ActionComponentProps<FillFiltersPayload>) {
  const {
    initialFilters = {},
    onApply = () => {},
    onReset = () => {},
  } = payload ?? {}
  const routesDataManager = useResourceManager('routesDataManager')
  const routesSnapshot = useDataManager<RoutesPack>(routesDataManager)
  const optionDataManager = useResourceManager('optionDataManager')
  const optionSnapshot = useDataManager(optionDataManager)

  const parseInitialDate = (path: 'start' | 'end') => {
    const raw = initialFilters?.delivery_date?.value?.[path]
    if (!raw) return null
    const parsed = new Date(raw)
    return Number.isNaN(parsed.valueOf()) ? null : parsed
  }

  const [activeTab, setActiveTab] = useState<ActiveTab>('route')
  const yearStart = useMemo(() => startOfYear(new Date()), [])
  const yearEnd = useMemo(() => endOfYear(new Date()), [])
  const [startDate, setStartDate] = useState<Date>(() =>
    clampToYear(parseInitialDate('start') ?? new Date(), yearStart, yearEnd),
  )
  const [endDate, setEndDate] = useState<Date>(() =>
    clampToYear(parseInitialDate('end') ?? addMonthsSafe(new Date(), 3), yearStart, yearEnd),
  )
  const [isOptimizedSelection, setIsOptimizedSelection] = useState<any[]>(() => {
    const val = initialFilters?.is_optimized?.value
    if (typeof val === 'boolean') return [val]
    if (Array.isArray(val)) return val
    return []
  })
  const [selectedStateIds, setSelectedStateIds] = useState<number[]>(() => {
    const val = initialFilters?.state_id?.value
    return Array.isArray(val) ? val : []
  })
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>(() => {
    const val = initialFilters?.driver_id?.value
    return Array.isArray(val) ? val : []
  })
  const [orderFilters, setOrderFilters] = useState(() => buildOrderFiltersFromInitial(initialFilters))

  useEffect(() => {
    const nextStart = startOfMonth(clampToYear(parseInitialDate('start') ?? new Date(), yearStart, yearEnd))
    const nextEnd = endOfMonth(clampToYear(parseInitialDate('end') ?? addMonthsSafe(new Date(), 3), yearStart, yearEnd))
    const [clampedStart, clampedEnd] = clampRange(nextStart, nextEnd)
    setStartDate(clampedStart)
    setEndDate(clampedEnd)
  }, [initialFilters, yearEnd, yearStart])

  useEffect(() => {
    setOrderFilters(buildOrderFiltersFromInitial(initialFilters))
  }, [initialFilters])

  const applyFilters = () => {
    const baseFilters: Record<string, any> = {
      delivery_date: {
        operation: 'range',
        value: {
          start: formatDateInput(startDate),
          end: formatDateInput(endDate),
        },
      },
    }

    if (isOptimizedSelection.length === 1) {
      baseFilters.is_optimized = { operation: '==', value: isOptimizedSelection[0] }
    }
    if (selectedStateIds.length > 0) {
      baseFilters.state_id = { operation: 'in', value: selectedStateIds }
    }
    if (selectedDriverIds.length > 0) {
      baseFilters.driver_id = { operation: 'in', value: selectedDriverIds }
    }

    const like = (value: string) => ({ operation: 'ilike', value: `%${value}%` })
    const ordersQuery: Record<string, any> = {}
    if (orderFilters.client_first_name.trim()) {
      ordersQuery['delivery_orders.client_first_name'] = like(orderFilters.client_first_name.trim())
    }
    if (orderFilters.client_last_name.trim()) {
      ordersQuery['delivery_orders.client_last_name'] = like(orderFilters.client_last_name.trim())
    }
    if (orderFilters.client_email.trim()) {
      ordersQuery['delivery_orders.client_email'] = like(orderFilters.client_email.trim())
    }
    const phoneContains = (phone: { prefix?: string; number?: string }) => {
      const value: Record<string, string> = {}
      if (phone.prefix?.trim()) {
        value.prefix = phone.prefix.trim()
      }
      if (phone.number?.trim()) {
        value.number = phone.number.trim()
      }
      return Object.keys(value).length > 0 ? { operation: 'contains', value } : null
    }
    const primaryPhone = phoneContains(orderFilters.client_primary_phone)
    if (primaryPhone) {
      ordersQuery['delivery_orders.client_primary_phone'] = primaryPhone
    }
    const secondaryPhone = phoneContains(orderFilters.client_secondary_phone)
    if (secondaryPhone) {
      ordersQuery['delivery_orders.client_secondary_phone'] = secondaryPhone
    }
    if (orderFilters.client_address.trim()) {
      ordersQuery['delivery_orders.client_address'] = { operation: 'json_ilike', value: `%${orderFilters.client_address.trim()}%` }
    }

    const combinedFilters = { ...baseFilters, ...ordersQuery }
    onApply(combinedFilters)
    onClose()
  }

  const resetFilters = () => {
    onReset()
    onClose()
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'route' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'}`}
          onClick={() => setActiveTab('route')}
        >
          Route filters
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'order' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'}`}
          onClick={() => setActiveTab('order')}
        >
          Order filters
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'route' ? (
          <RouteFiltersBody
            routesSnapshot={routesSnapshot}
            optionSnapshot={optionSnapshot}
            startDate={startDate}
            endDate={endDate}
            yearStart={yearStart}
            yearEnd={yearEnd}
            isOptimizedSelection={isOptimizedSelection}
            onOptimizedChange={setIsOptimizedSelection}
            selectedStateIds={selectedStateIds}
            onStateChange={setSelectedStateIds}
            selectedDriverIds={selectedDriverIds}
            onDriverChange={setSelectedDriverIds}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        ) : (
          <OrderFiltersBody orderFilters={orderFilters} setOrderFilters={setOrderFilters} />
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
        <BasicButton
          params={{
            variant: 'ghost',
            onClick: resetFilters,
          }}
        >
          Reset
        </BasicButton>
        <BasicButton
          params={{
            variant: 'primary',
            onClick: applyFilters,
          }}
        >
          Apply filters
        </BasicButton>
      </div>
    </div>
  )
}

function RouteFiltersBody({
  routesSnapshot,
  optionSnapshot,
  startDate,
  endDate,
  yearStart,
  yearEnd,
  isOptimizedSelection,
  onOptimizedChange,
  selectedStateIds,
  onStateChange,
  selectedDriverIds,
  onDriverChange,
  onStartDateChange,
  onEndDateChange,
}: {
  routesSnapshot: any
  optionSnapshot: any
  startDate: Date
  endDate: Date
  yearStart: Date
  yearEnd: Date
  isOptimizedSelection: any[]
  onOptimizedChange: (next: any[]) => void
  selectedStateIds: number[]
  onStateChange: (ids: number[]) => void
  selectedDriverIds: number[]
  onDriverChange: (ids: number[]) => void
  onStartDateChange: (d: Date) => void
  onEndDateChange: (d: Date) => void
}) {
  const anchorMonth = yearStart
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const buckets: MonthBucket[] = []
    const base = anchorMonth
    for (let i = 0; i < 12; i++) {
      const monthStart = addMonthsSafe(base, i)
      const monthEnd = endOfMonth(monthStart)
      buckets.push({
        label: formatMonthLabel(monthStart),
        start: monthStart,
        end: monthEnd,
        count: 0,
      })
    }
    const routes = routesSnapshot.dataset?.routes ?? []
    routes.forEach((route: RoutePayload) => {
      const d = route.delivery_date ? new Date(route.delivery_date) : null
      if (!d || Number.isNaN(d.valueOf())) return
      buckets.forEach((bucket) => {
        if (d >= bucket.start && d <= bucket.end) {
          bucket.count += 1
        }
      })
    })
    return buckets
  }, [anchorMonth, routesSnapshot.dataset?.routes])

  const startOffset = Math.max(0, Math.min(11, Math.round(monthsDiff(anchorMonth, startDate))))
  const endOffset = Math.max(startOffset, Math.min(11, Math.round(monthsDiff(anchorMonth, endDate))))

  const handleSliderChange = (field: 'start' | 'end', value: number) => {
    const monthStart = startOfMonth(clampToYear(addMonthsSafe(anchorMonth, value), yearStart, yearEnd))
    const monthEnd = endOfMonth(monthStart)
    if (field === 'start') {
      const nextStart = monthStart
      const nextEnd = endDate < nextStart ? monthEnd : endDate
      const [clampedStart, clampedEnd] = clampRange(nextStart, nextEnd)
      onStartDateChange(clampedStart)
      onEndDateChange(clampedEnd)
    } else {
      const nextEnd = monthEnd
      const nextStart = startDate > nextEnd ? monthStart : startDate
      const [clampedStart, clampedEnd] = clampRange(nextStart, nextEnd)
      onStartDateChange(clampedStart)
      onEndDateChange(clampedEnd)
    }
  }

  const handleDateInputChange = (field: 'start' | 'end', value: string) => {
    const parsed = clampToYear(new Date(value), yearStart, yearEnd)
    if (Number.isNaN(parsed.valueOf())) return
    if (field === 'start') {
      const nextStart = startOfMonth(parsed)
      const nextEnd = endDate < nextStart ? endOfMonth(nextStart) : endDate
      const [clampedStart, clampedEnd] = clampRange(nextStart, nextEnd)
      onStartDateChange(clampedStart)
      onEndDateChange(clampedEnd)
    } else {
      const nextEnd = endOfMonth(parsed)
      const nextStart = startDate > nextEnd ? startOfMonth(nextEnd) : startDate
      const [clampedStart, clampedEnd] = clampRange(nextStart, nextEnd)
      if (clampedStart !== startDate) onStartDateChange(clampedStart)
      onEndDateChange(clampedEnd)
    }
  }

  const routeStates = (optionSnapshot.dataset as any)?.route_states ?? []
  const driversMap = (optionSnapshot.dataset as any)?.drivers_map ?? {}
  const driverOptions =
    driversMap && typeof driversMap === 'object'
      ? Object.values(driversMap).map((driver: any) => ({
          value: driver.id,
          display: (
            <div className="flex items-center gap-2">
              <ProfilePicture
                src={driver.profile_picture ?? driver.avatar_url ?? null}
                initials={(driver.username ?? driver.email ?? 'DR').slice(0, 2).toUpperCase()}
                size={24}
              />
              <span>{driver.username ?? driver.email ?? `Driver ${driver.id}`}</span>
            </div>
          ),
        }))
      : []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-[var(--color-text)]">Date range</label>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--color-text)]">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-muted)]">From</span>
            <input
              type="date"
              value={formatDateInput(startDate)}
              onChange={(e) => handleDateInputChange('start', e.target.value)}
              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-muted)]">To</span>
            <input
              type="date"
              value={formatDateInput(endDate)}
              onChange={(e) => handleDateInputChange('end', e.target.value)}
              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>1 year max range</span>
        </div>
        <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-3">
          <div className="flex items-end gap-1 overflow-x-auto">
            {monthBuckets.map((bucket) => {
              const height = bucket.count === 0 ? 4 : Math.min(40, bucket.count * 6)
              return (
                <div key={bucket.label} className="flex flex-col items-center text-[10px] text-[var(--color-muted)]">
                  <div className="flex h-12 w-3 items-end justify-center">
                    <div className="w-2 rounded-t-sm bg-[var(--color-primary)]/30" style={{ height }} />
                  </div>
                  <span>{bucket.label}</span>
                </div>
              )
            })}
          </div>

          <div className="relative flex flex-col gap-2">
            <div className="h-2 rounded-full bg-[var(--color-border)]" />
            <div className="absolute inset-0 flex items-center px-1">
              <input
                type="range"
                min={0}
                max={11}
                step={1}
                value={startOffset}
                onChange={(e) => handleSliderChange('start', Number(e.target.value))}
                className="range-thumb w-full appearance-none bg-transparent"
              />
              <input
                type="range"
                min={0}
                max={11}
                step={1}
                value={endOffset}
                onChange={(e) => handleSliderChange('end', Number(e.target.value))}
                className="range-thumb w-full appearance-none bg-transparent"
              />
            </div>
            <div className="flex justify-between px-1 text-[10px] text-[var(--color-muted)]">
              <span>{monthBuckets[0]?.label}</span>
              <span>{monthBuckets[monthBuckets.length - 1]?.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm space-y-3">
        <Field label="Optimized">
          <MultiSelectDropDown
            options={[
              { value: true, display: 'Optimized' },
              { value: false, display: 'Not optimized' },
            ]}
            selected={isOptimizedSelection}
            onChange={(ids) => onOptimizedChange(ids)}
            placeholder="Any"
          />
        </Field>

        <Field label="Route states (multi-select)">
          <MultiSelectDropDown
            options={routeStates.map((state: any) => ({
              value: state.id,
              display: state.name ?? `State ${state.id}`,
            }))}
            selected={selectedStateIds}
            onChange={(ids) => onStateChange(ids)}
            placeholder="Select states"
          />
        </Field>

        <Field label="Drivers (multi-select)">
          <MultiSelectDropDown
            options={driverOptions}
            selected={selectedDriverIds}
            onChange={(ids) => onDriverChange(ids)}
            placeholder="Select drivers"
          />
        </Field>
      </div>
    </div>
  )
}

function OrderFiltersBody({
  orderFilters,
  setOrderFilters,
}: {
  orderFilters: {
    client_first_name: string
    client_last_name: string
    client_email: string
    client_primary_phone: { prefix: string; number: string }
    client_secondary_phone: { prefix: string; number: string }
    client_address: string
  }
  setOrderFilters: React.Dispatch<
    React.SetStateAction<{
      client_first_name: string
      client_last_name: string
      client_email: string
      client_primary_phone: { prefix: string; number: string }
      client_secondary_phone: { prefix: string; number: string }
      client_address: string
    }>
  >
}) {
  return (
    <div className="space-y-3">
      <Field label="Client first name">
        <InputField
          value={orderFilters.client_first_name}
          onChange={(e) => setOrderFilters((prev) => ({ ...prev, client_first_name: e.target.value }))}
        />
      </Field>
      <Field label="Client last name">
        <InputField
          value={orderFilters.client_last_name}
          onChange={(e) => setOrderFilters((prev) => ({ ...prev, client_last_name: e.target.value }))}
        />
      </Field>
      <Field label="Client email">
        <InputField
          value={orderFilters.client_email}
          onChange={(e) => setOrderFilters((prev) => ({ ...prev, client_email: e.target.value }))}
        />
      </Field>
      <PhoneField
        label="Primary phone"
        value={orderFilters.client_primary_phone}
        onChange={(phone) => setOrderFilters((prev) => ({ ...prev, client_primary_phone: phone }))}
      />
      <PhoneField
        label="Secondary phone"
        value={orderFilters.client_secondary_phone}
        onChange={(phone) => setOrderFilters((prev) => ({ ...prev, client_secondary_phone: phone }))}
      />
      <Field label="Client address (matches all fields)">
        <InputField
          value={orderFilters.client_address}
          onChange={(e) => setOrderFilters((prev) => ({ ...prev, client_address: e.target.value }))}
          placeholder="Search address (raw, city, country, postal code)"
        />
        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
          Matches against raw_address, city, country, postal_code (JSONB ilike).
        </p>
      </Field>
    </div>
  )
}
