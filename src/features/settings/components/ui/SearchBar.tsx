import { useEffect, useMemo, useState } from 'react'

import { DropDown } from '../../../../components/buttons/DropDown'
import { FilterIcon } from '../../../../assets/icons'

interface FilterOption {
  value: string
  label: string
}

interface InjectedSearchPayload {
  value: string
  filter?: string
  id?: string | number
}

interface SearchBarProps<TResponse, TQuery = Record<string, unknown>> {
  placeholder?: string
  filterOptions: FilterOption[]
  service: (query: TQuery) => Promise<TResponse>
  onResults: (response: TResponse) => void
  onReset?: () => void
  debounceMs?: number
  className?: string
  buildQuery?: (value: string, filter: string) => TQuery | null
  defaultFilter?: string
  injectedSearch?: InjectedSearchPayload | null
  isLoading?:boolean
  setIsLoading:(value:boolean) =>void
}

export function SettingsSearchBar<TResponse, TQuery = Record<string, unknown>>({
  placeholder = 'Search…',
  filterOptions,
  service,
  onResults,
  onReset,
  debounceMs = 400,
  className = '',
  buildQuery,
  defaultFilter,
  injectedSearch,
  setIsLoading
}: SearchBarProps<TResponse, TQuery>) {
  const [query, setQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState(defaultFilter ?? filterOptions[0]?.value ?? '')

  const [appliedInjectionId, setAppliedInjectionId] = useState<string | number | null>(null)

  const canSearch = Boolean(selectedFilter) || Boolean(buildQuery)

  useEffect(() => {
    setSelectedFilter(defaultFilter ?? filterOptions[0]?.value ?? '')
    setQuery('')
  }, [defaultFilter, filterOptions])

  useEffect(() => {
    if (!injectedSearch) {
      return
    }
    if (injectedSearch.id && injectedSearch.id === appliedInjectionId) {
      return
    }
    const nextFilter = injectedSearch.filter ?? defaultFilter ?? filterOptions[0]?.value ?? ''
    setSelectedFilter(nextFilter)
    setQuery(injectedSearch.value)
    setAppliedInjectionId(injectedSearch.id ?? null)
  }, [appliedInjectionId, defaultFilter, filterOptions, injectedSearch])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setIsLoading(false)
      onReset?.()
      return
    }
    const handle = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const payload = {
          [selectedFilter]: {
            operation: 'ilike',
            value: `%${trimmed}%`,
          },
        } as TQuery
        const builtPayload = buildQuery ? buildQuery(trimmed, selectedFilter) : payload
        if (!builtPayload) {
          setIsLoading(false)
          return
        }
        const response = await service(builtPayload)
        onResults(response)
      } catch (error) {
        console.error('Search failed', error)
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      window.clearTimeout(handle)
    }
  }, [canSearch, debounceMs, onReset, onResults, query, selectedFilter, service, setIsLoading])

  const filterOptionsMemo = useMemo(() => filterOptions, [filterOptions])

  return (
    <div className={`flex flex-col gap-3  p-4 ${className}`}>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <input
            className="h-11 w-full px-4 text-sm outline-none focus:border-[var(--color-primary)]"
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{backgroundColor:'#f5f5f5ff'}}
          />
        </div>
        {filterOptions.length > 0 && 
          <div className="w-full min-w-[160px] sm:w-56">
            <DropDown
              options={filterOptionsMemo.map((option) => ({
                value: option.value,
                display: option.label,
              }))}
              className="w-full"
              staticIcon={<FilterIcon className="app-icon h-4 w-4" />}
              state={[selectedFilter, (value) => setSelectedFilter(String(value))]}
            />
          </div>
        }
      </div>

    </div>
  )
}
