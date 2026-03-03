import { useMemo } from 'react'
import { CustomTimePicker } from '@/shared/inputs/CustomTimePicker'
import { Switch } from '@/shared/inputs/Switch'

import type { CostumerOperatingHours } from '../../../dto/costumer.dto'
import type { CostumerFormLayoutModel } from '../CostumerForm.layout.model'
import { WEEKDAY_OPTIONS } from '../flows/costumerOperatingHours.flow'

type CostumerOperatingHoursEditorProps = {
  model: CostumerFormLayoutModel
}

export const CostumerOperatingHoursEditor = ({ model }: CostumerOperatingHoursEditorProps) => {
  const entriesByWeekday = useMemo(() => {
    const byWeekday = new Map<number, (typeof model.formState.operating_hours)[number]>()
    model.formState.operating_hours.forEach((entry) => {
      byWeekday.set(entry.weekday, entry)
    })
    return byWeekday
  }, [model.formState.operating_hours])

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-page)]">
      {WEEKDAY_OPTIONS.map((day) => {
        const entry = entriesByWeekday.get(day.weekday)
        const isSelected = Boolean(entry)

        return (
          <OperatingDayRow
            key={day.weekday}
            day={day}
            entry={entry}
            isSelected={isSelected}
            model={model}
          />
        )
      })}
    </div>
  )
}

type OperatingDayRowProps = {
  day: (typeof WEEKDAY_OPTIONS)[number]
  entry: CostumerOperatingHours | undefined
  isSelected: boolean
  model: CostumerFormLayoutModel
}

const OperatingDayRow = ({
  day,
  entry,
  isSelected,
  model,
}: OperatingDayRowProps) => {
  return (
    <div
      className={`grid grid-cols-1 items-center gap-3 px-4 py-3 md:grid-cols-[140px_1fr_auto] ${
        isSelected ? 'bg-[var(--color-light-blue)]/10' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {
            if (isSelected) {
              model.formSetters.removeOperatingDay(day.weekday)
            } else {
              model.formSetters.toggleOperatingDay(day.weekday)
            }
          }}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-[var(--color-text)]">{day.longLabel}</span>
      </div>

      <div className="min-h-[38px]">
        {isSelected && !entry?.is_closed ? (
          <div className="flex items-center gap-3">
            <CustomTimePicker
              selectedTime={entry?.open_time ?? null}
              onChange={(value) => model.formSetters.setOperatingDayOpenTime(day.weekday, value)}
            />
            <span className="text-xs text-[var(--color-muted)]">-</span>
            <CustomTimePicker
              selectedTime={entry?.close_time ?? null}
              onChange={(value) => model.formSetters.setOperatingDayCloseTime(day.weekday, value)}
            />
          </div>
        ) : isSelected ? (
          <div className="flex min-h-[38px] items-center">
            <span className="text-xs italic text-[var(--color-muted)]">Marked as closed</span>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        {isSelected ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)]">Closed</span>
            <Switch
              value={Boolean(entry?.is_closed)}
              onChange={(value) => model.formSetters.setOperatingDayClosed(day.weekday, value)}
              sizeClassName="h-7 w-12"
              ariaLabel={`Toggle ${day.longLabel} closed`}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
