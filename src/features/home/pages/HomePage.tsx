import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'


import { BasicButton } from '../../../components/buttons/BasicButton'

import { MapPanel } from '../components/panels/MapPanel'

import { ActionManager, useActionEntries } from '../../../resources_manager/managers/ActionManager'
import { ResourcesManagerProvider, useResourceManager } from '../../../resources_manager/resourcesManagerContext'
import { AnimatePresence } from 'framer-motion'

import {popup_map} from '../components/popup_fills/popup_map'
import Popup_1 from '../../../components/popups/Popup_1'

import {sectionMap} from '../components/section_panels/section_map'
import { SectionPanel } from '../components/panels/SectionPanel'
import RouteSection from '../components/section_panels/RoutesSection'


import { DataManager } from '../../../resources_manager/managers/DataManager'
import { DeliveryService } from '../api/deliveryService'
import { OptionService, type RouteDependencies } from '../api/optionServices'
import { MapManager } from '../../../google_maps/MapManager'

import type { RoutesPack } from '../types/backend'
import { BoldArrowIcon, RouteIcon, SettingIcon, FilterIcon } from '../../../assets/icons'




export function HomePage() {
  const [routePanelExpanded, setRoutePanelExpanded] = useState(true)
  const [preferredRouteWidth, setPreferredRouteWidth] = useState(400)
  const firstOpenSection = useRef<string>(null)
  const closingAllSections = useRef<boolean>(false)
  const prevExpandedDuringDrag = useRef<boolean>(true)

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

  const routesDataManager = useMemo(()=> new DataManager<RoutesPack>({
      dataset:null, // {routes: mockDeliveryDataset.routes}
      activeSelections:{},
      isLoading:false
    }),
    []
  )

  const optionDataManager = useMemo(() => new DataManager<RouteDependencies>({
        dataset: null,
        activeSelections: {},
        isLoading: false,
      }),
    [],
  )
  const mapManager = useMemo(() => new MapManager(), [])
  const deliveryServiceInstance = useMemo(() => new DeliveryService(), [])
  const optionServiceInstance = useMemo(() => new OptionService(), [])
  const [routeFilters, setRouteFilters] = useState<Record<string, any>>(() => buildInitialRouteFilters())

  const entries = useActionEntries(sectionManager)
  useActionEntries(popupManager)

  const [isCalendarView, setIsCalendarView] = useState(false)
  const isRouteCompact = entries.length > 0 && !isCalendarView
  const routePanelWidth = routePanelExpanded ? preferredRouteWidth : 0
  const memorizedRoutePanelExpanded = useRef<boolean | null>(null)

  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    const nextWidth = mode === 'calendar' ? 600 : 400
    setPreferredRouteWidth(nextWidth)
    setIsCalendarView(mode === 'calendar')
  }

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
        const routes = await deliveryServiceInstance.fetchRoutes(routeFilters)
        if (cancelled) {
          return
        }

        if (!routes || routes.items.length === 0) {
          routesDataManager.setDataset({ routes: [] })
        } else {
          routesDataManager.setDataset({ routes: routes.items })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch routes', error)
        }
      }
    }
    fetchRoutes()
    return () => {
      cancelled = true
    }
  }, [deliveryServiceInstance, routeFilters, routesDataManager])

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
          optionDataManager.setDataset({
            ...dependencies,
            route_states_map: buildInstantAccessMap(dependencies.route_states),
            drivers_map: buildInstantAccessMap(dependencies.drivers),
            item_states_map: buildInstantAccessMap(dependencies.item_states),
            item_positions_map: buildInstantAccessMap(dependencies.item_positions),
          })
        } else {
          optionDataManager.setDataset(null)
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
  }, [optionDataManager, optionServiceInstance])

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

 

  return (
    <ResourcesManagerProvider managers={{popupManager, sectionManager, routesDataManager, optionDataManager, mapManager }}>
      
        <div className="h-screen overflow-hidden bg-[var(--color-page)] text-[var(--color-text)]">
          <AnimatePresence >
            {popupManager.renderStack()}
          </AnimatePresence>
            
          <div className="flex h-full w-screen flex-col overflow-hidden">
            <DesktopHeader params={{ routeFilters, setRouteFilters }}/>
            <main className=" flex z-1 flex-1 overflow-y-hidden overflow-x-visible">
             
              <MapPanel/>

                <div className="z-4 flex h-full overflow-x-visible">
                  <div
                    className="h-full"
                    style={{ width: `${routePanelWidth}px` }}
                  >
                    <SectionPanel params={{
                        icon:<RouteIcon className="app-icon h-5 w-5" />,
                        label:"Routes",
                        className:`w-[${routePanelWidth}px] z-1`,
                        compact:isRouteCompact
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
                      


                      {sectionManager.renderStack()}
                  </div>
                </div>
            </main>
          </div>
        </div>

    </ResourcesManagerProvider>
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
