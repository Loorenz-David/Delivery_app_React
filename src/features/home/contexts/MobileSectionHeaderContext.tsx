import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'

export interface MobileHeaderAction {
  label: string
  icon?: ReactNode
  onClick?: () => void
}

export interface MobileHeaderConfig {
  id: string
  title?: ReactNode
  onBack?: () => void
  menuActions?: MobileHeaderAction[]
  secondaryContent?: ReactNode
}

interface MobileSectionHeaderContextValue {
  activeHeader: MobileHeaderConfig | null
  registerHeader: (config: Omit<MobileHeaderConfig, 'id'>) => string
  updateHeader: (id: string, config: Partial<Omit<MobileHeaderConfig, 'id'>>) => void
  removeHeader: (id: string) => void
  popHeader: () => void
  headerRef: MutableRefObject<HTMLDivElement | null>
  getHeaderHeight: () => number
}

const MobileSectionHeaderContext = createContext<MobileSectionHeaderContextValue | null>(null)

export function useMobileSectionHeader() {
  return useContext(MobileSectionHeaderContext)
}

export function MobileSectionHeaderProvider({ children }: { children: ReactNode }) {
  const [headers, setHeaders] = useState<MobileHeaderConfig[]>([])
  const headerRef = useRef<HTMLDivElement | null>(null)

  const registerHeader = useCallback((config: Omit<MobileHeaderConfig, 'id'>) => {
    const id = crypto.randomUUID()
    setHeaders((prev) => [...prev, { ...config, id }])
    return id
  }, [])

  const updateHeader = useCallback((id: string, config: Partial<Omit<MobileHeaderConfig, 'id'>>) => {
    setHeaders((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...config } : entry)))
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const popHeader = useCallback(() => {
    setHeaders((prev) => prev.slice(0, Math.max(prev.length - 1, 0)))
  }, [])

  const getHeaderHeight = useCallback(() => {
    return headerRef.current?.getBoundingClientRect().height ?? 0
  }, [])

  const value = useMemo<MobileSectionHeaderContextValue>(() => {
    const activeHeader = headers.length ? headers[headers.length - 1] : null
    return {
      activeHeader,
      registerHeader,
      updateHeader,
      removeHeader,
      popHeader,
      headerRef,
      getHeaderHeight,
    }
  }, [getHeaderHeight, headers, popHeader, registerHeader, removeHeader, updateHeader])

  return <MobileSectionHeaderContext.Provider value={value}>{children}</MobileSectionHeaderContext.Provider>
}
