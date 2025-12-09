import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FilterIcon } from '../../../../assets/icons'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DropDown } from '../../../../components/buttons/DropDown'

type FilterOption = {
  value: string
  label: string
}

export interface RelationshipOption {
  id: number
  name: string
}

interface SelectItemPropertiesRelationshipsProps {
  label: string
  selectedIds: number[]
  onChange: (ids: number[]) => void
  loadOptions: (query?: Record<string, unknown>) => Promise<RelationshipOption[]>
  filterOptions?: FilterOption[]
  buildQuery?: (value: string, filter: string) => Record<string, unknown> | null
  placeholder?: string
}

export function SelectItemPropertiesRelationships({
  label,
  selectedIds,
  onChange,
  loadOptions,
  filterOptions = [],
  buildQuery,
  placeholder = 'Search…',
}: SelectItemPropertiesRelationshipsProps) {
  const [options, setOptions] = useState<RelationshipOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(filterOptions[0]?.value ?? 'name')

  const loadOptionsRef = useRef(loadOptions)
  useEffect(() => {
    loadOptionsRef.current = loadOptions
  }, [loadOptions])

  const fetchOptions = useCallback(async (query?: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const items = await loadOptionsRef.current(query)
      setOptions(items ?? [])
    } catch (error) {
      console.error('Failed to fetch options', error)
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptions({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const trimmed = search.trim()
    if (!trimmed) {
      fetchOptions({})
      return
    }
    const query = buildQuery
      ? buildQuery(trimmed, filter)
      : {
          [filter]: {
            operation: 'ilike',
            value: `%${trimmed}%`,
          },
        }
    if (query === null) {
      return
    }
    const handle = window.setTimeout(() => {
      fetchOptions(query)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [buildQuery, fetchOptions, filter, search])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const handleToggle = (id: number) => {
    const next = new Set(selectedSet)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.id))
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 text-sm font-semibold text-[var(--color-text)]">{label}</div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>
            {selectedIds.length}/{options.length} selected
          </span>
          <button type="button" className="underline" onClick={handleSelectAll}>
            Select all
          </button>
          <button type="button" className="underline" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)]">
          <input
            className="h-10 w-full bg-transparent px-3 text-sm outline-none"
            placeholder={placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {filterOptions.length > 0 ? (
          <div className="min-w-[160px]">
            <DropDown
              options={filterOptions.map((option) => ({ value: option.value, display: option.label }))}
              className="w-full"
              staticIcon={<FilterIcon className="app-icon h-4 w-4" />}
              state={[filter, (value) => setFilter(String(value))]}
            />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-xs text-[var(--color-muted)]">Loading options…</p>
      ) : options.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">No options available.</p>
      ) : (
        <div className="grid gap-2">
          {options.map((option) => {
            const isChecked = selectedSet.has(option.id)
            return (
              <label
                key={option.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                <span>{option.name}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(option.id)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
              </label>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-end">
        <BasicButton
          params={{
            variant: 'secondary',
            className: 'text-xs font-semibold uppercase tracking-[0.2em]',
            onClick: handleClear,
          }}
        >
          Clear selection
        </BasicButton>
      </div>
    </div>
  )
}
