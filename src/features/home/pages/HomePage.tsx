import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { AnimatePresence, motion } from 'framer-motion'

import { BasicButton } from '../../../components/buttons/BasicButton'

import { MapPanel } from '../components/panels/MapPanel'
import { MobileSectionSheet } from '../components/panels/MobileSectionSheet'

import { ActionManager, useActionEntries } from '../../../resources_manager/managers/ActionManager'
import { ResourcesManagerProvider, useResourceManager } from '../../../resources_manager/resourcesManagerContext'
import { SectionPanelContext } from '../contexts/SectionPanelContext'

import { popup_map } from '../components/popup_fills/popup_map'
import Popup_1 from '../../../components/popups/Popup_1'

import { sectionMap } from '../components/section_panels/section_map'
import { SectionPanel } from '../components/panels/SectionPanel'
import RouteSection from '../components/section_panels/RoutesSection'

import { DeliveryService } from '../api/deliveryService'
import { OptionService } from '../api/optionServices'
import { MapManager } from '../../../google_maps/MapManager'

import { BackArrowIcon2, BoldArrowIcon, RouteIcon, SettingIcon, FilterIcon } from '../../../assets/icons'
import { useHomeStore } from '../../../store/home/useHomeStore'




export function HomePage() {
  const navigate = useNavigate()
  const [routePanelExpanded, setRoutePanelExpanded] = useState(true)
  const [preferredRouteWidth, setPreferredRouteWidth] = useState(400)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoadingSectionInfo,setIsLoadingSectionInfo] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1000,
  )
  const [mobileHeaderOpacity, setMobileHeaderOpacity] = useState(1)
  const firstOpenSection = useRef<string>(null)
  const closingAllSections = useRef<boolean>(false)
  const prevExpandedDuringDrag = useRef<boolean>(true)

  const isMobileObject = useMemo(() => ({
    isMobile:isMobileViewport,
    isMenuOpen:isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsMobileViewport,
  }), [isMobileViewport, isMobileMenuOpen])

  const popupManager = useMemo(() => new ActionManager({
        blueprint: Popup_1,
        registry: popup_map,
      }),
    [],
  )
  const sectionManager = useMemo(()=> new ActionManager({
      blueprint: SectionPanel,
      registry: sectionMap

      }),
    []
  )

  const mapManager = useMemo(() => new MapManager(), [])
  const deliveryServiceInstance = useMemo(() => new DeliveryService(), [])
  const optionServiceInstance = useMemo(() => new OptionService(), [])
  const resourceManagers = useMemo(
    () => ({ popupManager, sectionManager, mapManager }),
    [popupManager, sectionManager, mapManager],
  )
  const setRoutes = useHomeStore.getState().setRoutes
  const setDependencies = useHomeStore.getState().setDependencies
  const [routeFilters, setRouteFilters] = useState<Record<string, any>>(() => buildInitialRouteFilters())

  const entries = useActionEntries(sectionManager)
  useActionEntries(popupManager)

  const [isCalendarView, setIsCalendarView] = useState(false)
  const isRouteCompact = entries.length > 0 && !isCalendarView
  const routePanelWidth = routePanelExpanded ? preferredRouteWidth : 0
  const memorizedRoutePanelExpanded = useRef<boolean | null>(null)

  const handleViewModeChange = useCallback((mode: 'list' | 'calendar') => {
    const nextWidth = mode === 'calendar' ? 600 : 400
    setPreferredRouteWidth(nextWidth)
    setIsCalendarView(mode === 'calendar')
  }, [])

  const handleSheetProgress = useCallback((progress: number) => {
    // progress: 0 = closed, 1 = fully open

    const nextOpacity = Math.max(0,  progress > 0.51 ? 1 - progress : 1)
    setMobileHeaderOpacity(nextOpacity)
  }, [])

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 1000)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobileViewport && isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobileMenuOpen, isMobileViewport])

  useEffect(()=>{
    if( closingAllSections.current != true){
      if(entries.length > 0){
        if(!firstOpenSection.current){
          firstOpenSection.current = entries[0].id
        }else{
          if(entries[0].id !== firstOpenSection.current){
            closingAllSections.current = true
            firstOpenSection.current = null
            entries.forEach((entry, i) => {
              setTimeout(() => sectionManager.close(entry.id), i * 100) // staggered close
            })
            closingAllSections.current = false
          }
        }
      }else{
        firstOpenSection.current = null
      }
    }
  },[entries])

  useEffect(() => {
    if (entries.length === 0 && !routePanelExpanded) {
      setRoutePanelExpanded(true)
    }
  }, [entries.length, routePanelExpanded])

  useEffect(() => {
    if (entries.length > 1) {
      if (memorizedRoutePanelExpanded.current === null) {
        memorizedRoutePanelExpanded.current = routePanelExpanded
      }
      if (routePanelExpanded) {
        setRoutePanelExpanded(false)
      }
    } else if (entries.length === 1) {
      if (memorizedRoutePanelExpanded.current !== null) {
        const next = memorizedRoutePanelExpanded.current
        memorizedRoutePanelExpanded.current = null
        if (routePanelExpanded !== next) {
          setRoutePanelExpanded(next)
        }
      }
    } else {
      memorizedRoutePanelExpanded.current = null
    }
  }, [entries.length, routePanelExpanded])

  // fetch routes whenever filters change
  useEffect(() => {
    let cancelled = false
    const fetchRoutes = async () => {
      try {
        setIsLoadingSectionInfo(true)
        const routes = await deliveryServiceInstance.fetchRoutes(routeFilters)
        if (cancelled) {
          return
        }

        setRoutes(routes?.items ?? [])
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch routes', error)
        }
      }finally{
        setIsLoadingSectionInfo(false)
      }
    }
    fetchRoutes()
    return () => {
      cancelled = true
    }
  }, [deliveryServiceInstance, routeFilters, setRoutes])

  // fetch dependencies once on mount
  useEffect(() => {
    let cancelled = false
    const fetchDeps = async () => {
      try {
        const dependencies = await optionServiceInstance.fetchMainDependencies()
        if (cancelled) {
          return
        }
        if (dependencies) {
          setDependencies({
            ...dependencies,
            route_states_map: buildInstantAccessMap(dependencies.route_states),
            drivers_map: buildInstantAccessMap(dependencies.drivers),
            item_states_map: buildInstantAccessMap(dependencies.item_states),
            item_positions_map: buildInstantAccessMap(dependencies.item_positions),
          })
        } else {
          setDependencies({
            route_states: [],
            drivers: [],
            item_states: [],
            item_positions: [],
            default_warehouses: [],
            item_options: [],
            route_states_map: {},
            drivers_map: {},
            item_states_map: {},
            item_positions_map: {},
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch dependencies', error)
        }
      }
    }
    fetchDeps()
    return () => {
      cancelled = true
    }
  }, [optionServiceInstance, setDependencies])

  useEffect(() => {
    // Any extra section beyond the primary Orders panel is rendered absolutely to the left,
    // so pad the map on the right to keep highlighted markers in view.
    const overlayWidth = Math.max(entries.length, 1) * 200 // approximate width per open panel
    const bottomPadding = isMobileViewport ? 220 : 16
    mapManager.setPadding({
      left: 16,
      right: 16 + overlayWidth,
      top: 16,
      bottom: bottomPadding,
    })
  }, [entries.length, isMobileViewport, mapManager])


  const handleTabClick = () => {
    setRoutePanelExpanded((prev) => !prev)
  }

  const isOrderDrag = (event: React.DragEvent) => event.dataTransfer?.types?.includes('application/x-order-transfer')

  const handleTabDragEnter = (event: React.DragEvent) => {
    if (!isOrderDrag(event)) return
    prevExpandedDuringDrag.current = routePanelExpanded
    setRoutePanelExpanded(true)
  }

  const handleTabDragLeave = (event: React.DragEvent) => {
    if (!isOrderDrag(event)) return
    setRoutePanelExpanded(prevExpandedDuringDrag.current)
  }

  const sectionStack = sectionManager.renderStack()

  const openFilters = useCallback(() => {
    popupManager.open({
      key: 'FillFilters',
      payload: {
        initialFilters: routeFilters,
        onApply: (filters: Record<string, any>) => setRouteFilters(filters),
        onReset: () => setRouteFilters(buildInitialRouteFilters()),
      },
    })

  }, [popupManager, routeFilters, setIsMobileMenuOpen, setRouteFilters])

  const goToSettings = useCallback(() => {
    navigate('/settings')
    setIsMobileMenuOpen(false)
  }, [navigate, setIsMobileMenuOpen])

  
 

  return (
    <ResourcesManagerProvider managers={{...resourceManagers, isMobileObject}}>
      
        <div className="h-screen overflow-hidden bg-[var(--color-page)] text-[var(--color-text)]">
          <AnimatePresence >
            {popupManager.renderStack()}
          </AnimatePresence>
            
          <div className="flex h-full w-screen flex-col overflow-hidden">
            
            {!isMobileViewport &&
              <DesktopHeader params={{ routeFilters, setRouteFilters }}/>
            }
            <main className="relative z-1 flex flex-1 overflow-y-hidden overflow-x-visible">
              <MapPanel/>
              
              {isMobileViewport ? (
                <>
                  <MobileHeader
                    onOpenMenu={() => { setIsMobileMenuOpen(true)}}
                    opacity={mobileHeaderOpacity}
                    />
                  <MobileSectionSheet
                    sectionStack={sectionStack}
                    onOpenFilters={openFilters}
                    onOpenSettings={goToSettings}
                    onProgressChange={handleSheetProgress}
                  />
                </>
              ) : (
                <div className="z-4 flex h-full overflow-x-visible">
                  <div
                    className="h-full"
                    style={{ width: `${routePanelWidth}px` }}
                  >
                    <SectionPanel params={{
                        icon:<RouteIcon className="app-icon h-5 w-5" />,
                        label:"Routes",
                        className:`w-[${routePanelWidth}px] z-1`,
                        compact:isRouteCompact,
                        isLoadingSectionInfo:isLoadingSectionInfo
                    }}>
                      <RouteSection isCompact={isRouteCompact} onViewModeChange={handleViewModeChange}/>
                    </SectionPanel>
                  </div>

                  <div className="relative z-2 flex h-full overflow-visible">
                      {entries.length === 1 &&
                        <div
                        className="absolute left-0 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 transform items-center"
                        onDragEnter={handleTabDragEnter}
                        onDragLeave={handleTabDragLeave}
                        >
                        <button
                          type="button"
                          className="group relative flex h-16 w-6 items-center justify-center rounded-2xl border  border-[var(--color-border)] bg-white shadow"
                          onClick={handleTabClick}
                        >
                          <BoldArrowIcon
                            className={`app-icon  h-4 w-4 transition-transform ${routePanelExpanded ? '' : 'rotate-180'}`}
                          />
                        </button>
                      </div>
                      }
                      


                      {sectionStack}
                  </div>
                </div>
              )}
            </main>
            {isMobileViewport && (
              <MobileMenuDrawer
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onOpenFilters={openFilters}
                onOpenSettings={goToSettings}
                routePanel={
                  <RouteSection isCompact={isRouteCompact} onViewModeChange={handleViewModeChange}/>
                }
              />
            )}
          </div>
        </div>

    </ResourcesManagerProvider>
  )
}

interface MobileHeaderProps {
  onOpenMenu?: () => void
  opacity?: number
}

function MobileHeader({ onOpenMenu, opacity = 1 }: MobileHeaderProps) {
  const hidden = opacity <= 0.02
  return (
    <div
      className=""
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 10,
        opacity,
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'auto',
        transition: 'opacity 160ms ease',
      }}
      hidden={hidden}
    >
      {onOpenMenu && (
        <BasicButton
          params={{ variant: 'rounded', onClick: onOpenMenu, ariaLabel: 'Open actions' }}
        >
          <div className="flex flex-col items-end gap-1 px-3 py-2 transition active:scale-95">
            <span className="h-0.5 w-5 bg-[var(--color-text)]" />
            <span className="h-0.5 w-5 bg-[var(--color-text)]" />
            <span className="h-0.5 w-5 bg-[var(--color-text)]" />
          </div>
        </BasicButton>
      )}
    </div>
  )
}

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  routePanel: ReactNode
  onOpenFilters: () => void
  onOpenSettings: () => void
}

function MobileMenuDrawer({ isOpen, onClose, routePanel, onOpenFilters, onOpenSettings }: MobileMenuDrawerProps) {
  const [interactionActions, setInteractionActions] = useState<ReactNode[]>([])
  const [createRouteAction, setHeaderActions] = useState<ReactNode[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)


  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (menuButtonRef.current?.contains(target) || menuRef.current?.contains(target))) {
        return
      }
      setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleClickAway)
    return () => document.removeEventListener('pointerdown', handleClickAway)
  }, [isMenuOpen])

  const renderMenu = () => {
    if (!isMenuOpen) return null
    return (
      <div
        ref={menuRef}
        className="absolute right-3 top-[calc(100%+8px)] z-20 w-64 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-xl"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {interactionActions.length === 0 ? (
          <p className="px-3 py-2 text-sm text-[var(--color-muted)]">No actions available.</p>
        ) : (
          interactionActions.map((action, index) => (
            <div
              key={`mobile-menu-action-${index}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-accent)]"
            >
              <div className="flex-1">{action}</div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9] flex lg:hidden"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="relative z-10 flex h-full w-full max-w-[520px] flex-col bg-white text-[var(--color-text)] shadow-2xl"
            initial={{ x: -32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="relative flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <BasicButton params={{ variant: 'rounded', onClick: onClose, ariaLabel: 'Close menu' }}>
                <BackArrowIcon2 className="app-icon-dark h-5 w-5" />
              </BasicButton>
              <div className="flex min-w-0 flex-1 justify-end gap-3">
                
                <BasicButton params={{ variant: 'rounded', onClick: onOpenSettings, ariaLabel: 'Settings' }}>
                  <SettingIcon className="app-icon-dark h-5 w-5" />
                </BasicButton>
                <BasicButton params={{ variant: 'rounded', onClick: onOpenFilters, ariaLabel: 'Open filters' }}>
                  <FilterIcon className="app-icon-dark h-5 w-5" />
                </BasicButton>
                {createRouteAction.map((action, index) => (
                  <div key={`mobile-header-action-${index}`}>{action}</div>
                ))}
                <BasicButton
                  params={{ variant: 'rounded', onClick: () => setIsMenuOpen((prev) => !prev), ariaLabel: 'Open actions' }}
                  ref={menuButtonRef}
                >
                  <div className="flex flex-col items-center justify-center gap-[3px] text-[var(--color-text)]">
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                  </div>
                </BasicButton>
                {renderMenu()}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden px-4 py-3">
              <div className="h-full overflow-y-auto">
                <div className="overflow-hidden ">
                  <SectionPanelContext.Provider
                    value={{
                      setHeaderActions,
                      setInteractionActions
                    }}
                  >
                    {routePanel}
                  </SectionPanelContext.Provider>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


interface DesktopHeaderProps {
  params: {
    routeFilters: Record<string, any>
    setRouteFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>
  }
}

function DesktopHeader({params}: DesktopHeaderProps) {
  const { routeFilters, setRouteFilters } = params
  const popupManager = useResourceManager('popupManager')
  const navigate = useNavigate()
  return (
    <header className="hidden flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] p-4 lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Delivery App</p>

      </div>
      <div className="flex items-center gap-4">
        <BasicButton
          params={{
            variant: 'secondary',
            onClick: () => {
              popupManager.open({
                key: 'FillFilters',
                payload: {
                  initialFilters: routeFilters,
                  onApply: (filters: Record<string, any>) => setRouteFilters(filters),
                  onReset: () => setRouteFilters(buildInitialRouteFilters()),
                },
              })
            },
          }}
        >
           <div className="flex gap-2"> <FilterIcon className="app-icon h-5 w-5"/> Filters </div>
        </BasicButton>
         <BasicButton
          params={{
            variant: 'secondary',
            onClick: () => navigate('/settings'),
          }}
        >
          <div className="flex gap-2"> <SettingIcon className="app-icon h-5 w-5"/> Settings </div>
        </BasicButton>
      </div>
    </header>
  )
}

function buildInstantAccessMap<T extends { id: number }>(items?: T[] | null) {
  if (!items || !items.length) {
    return {}
  }
  return items.reduce<Record<number, T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}

function buildInitialRouteFilters() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const addMonths = (date: Date, months: number) => {
    const next = new Date(date)
    next.setMonth(next.getMonth() + months)
    return next
  }
  const start = formatDate(startOfMonth)
  const end = formatDate(addMonths(startOfMonth, 3))
  return {
    delivery_date: {
      operation: 'range',
      value: {
        start,
        end,
      },
    },
  }
}
