import { useCallback, useEffect, useMemo, useState } from 'react'

import { InfoIcon, ThunderIcon, TruckIcon } from '../../../../assets/icons'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DropDown } from '../../../../components/buttons/DropDown'
import { Field } from '../../../../components/forms/FieldContainer'
import { ToggleSwitch } from '../../../../components/buttons/ToggleSwitch'
import { CollapsibleSection } from '../../../../components/forms/CollapsibleSection'
import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import type { ActionPayload } from '../../../../resources_manager/managers/ActionManager'
import type { OrderPayload, RoutePayload } from '../../types/backend'
import { OptimizeRouteService, type OptimizeRoutePayload } from '../../api/deliveryService'
import { ApiError } from '../../../../lib/api/ApiClient'
import { mergeRouteWithOptimizedData, patchRouteInDataManager } from '../../utils/routeDataHelpers'

interface RouteOptimizationSectionProps {
    payload?: ActionPayload
    onClose: () => void
}

const vehicleOptions = [
    { value: 'car', display: 'Car' },
    { value: 'van', display: 'Van' },
    { value: 'truck', display: 'Truck' },
    { value: 'bicycle', display: 'Bicycle' },
]

const defaultRouteModifiers = {
    avoid_tolls: false,
    avoid_highways: false,
    avoid_ferries: false,
    avoid_indoor: false,
}

type RouteModifierKey = keyof typeof defaultRouteModifiers

const routeModifierLabels: Record<RouteModifierKey, { title: string; description: string }> = {
    avoid_tolls: { title: 'Avoid Tolls', description: 'Avoid toll roads when possible' },
    avoid_highways: { title: 'Avoid Highways', description: 'Prefer smaller roads and avoid highways' },
    avoid_ferries: { title: 'Avoid Ferries', description: 'Prevent ferry segments in the route' },
    avoid_indoor: { title: 'Avoid Indoors', description: 'Skips paths marked as indoor segments' },
}

const objectiveOptions = [
    { value: 'MIN_TRAVEL_TIME', display: 'Minimize Travel Duration' },
    { value: 'MIN_DISTANCE', display: 'Minimize Travel Distance' },
]

type ObjectiveValue = (typeof objectiveOptions)[number]['value']

const tipMessage =
    'The optimization algorithm considers delivery windows, vehicle capacity, and road restrictions to create the most efficient route.'

const RouteOptimizationSection = ({ payload, onClose }: RouteOptimizationSectionProps) => {
    const { setHeaderActions } = useSectionPanel()
    const routesDataManager = useResourceManager('routesDataManager')
    const { showMessage } = useMessageManager()
    const optimizeRouteService = useMemo(() => new OptimizeRouteService(), [])
    const payloadRecord = payload as Record<string, unknown> | undefined
    const payloadRouteId =
        typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const activeRouteSelection = routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
    const selectedRouteId =
        typeof activeRouteSelection?.id === 'number' ? (activeRouteSelection.id as number) : undefined
    const routeId = payloadRouteId ?? selectedRouteId ?? null

    const [considerTraffic, setConsiderTraffic] = useState(true)
    const [sideOfRoad, setSideOfRoad] = useState(true)
    const [vehicleType, setVehicleType] = useState<string>('van')
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [routeModifiers, setRouteModifiers] = useState(() => ({ ...defaultRouteModifiers }))
    const [objective, setObjective] = useState<ObjectiveValue>('MIN_TRAVEL_TIME')

    useEffect(() => {
        setHeaderActions?.([
            <BasicButton
                key="close-route-optimization"
                params={{
                    variant: 'secondary',
                    onClick: onClose,
                }}
            >
                <div className=" text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] ">
                    Close
                </div>
            </BasicButton>,
        ])
        return () => {
            setHeaderActions?.([])
        }
    }, [onClose, setHeaderActions])

    const optimizationPayload = useMemo(() => {
        if (routeId == null) {
            return null
        }
        return {
            route_id: routeId,
            consider_traffic: considerTraffic,
            side_of_road: sideOfRoad,
            route_modifiers: routeModifiers,
            objectives: [{ type:{[objective]: true} }],
        } satisfies OptimizeRoutePayload
    }, [considerTraffic, objective, routeId, routeModifiers, sideOfRoad])

    const applyOptimizedRoute = useCallback(
        (optimizedRoute: RoutePayload) => {
            const resolvedRoute = patchRouteInDataManager({
                routesDataManager,
                routeId: optimizedRoute.id,
                updater: (route) => mergeRouteWithOptimizedData(route, optimizedRoute),
            })
            if (resolvedRoute) {
                const activeOrderSelection = routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')
                if (activeOrderSelection?.id && resolvedRoute.delivery_orders) {
                    const updatedOrder = resolvedRoute.delivery_orders.find(
                        (entry) => entry.id === activeOrderSelection.id,
                    )
                    if (updatedOrder) {
                        routesDataManager.setActiveSelection('SelectedOrder', {
                            id: activeOrderSelection.id,
                            data: updatedOrder,
                            meta: {
                                ...(activeOrderSelection.meta ?? {}),
                                routeId: resolvedRoute.id,
                            },
                        })
                    }
                }
            }
        },
        [routesDataManager],
    )

    const handleOptimizationRequest = useCallback(
        async (action: 'optimize' | 'update') => {
            if (!optimizationPayload) {
                showMessage({
                    status: 'warning',
                    message: 'Select a route before running the optimizer.',
                })
                return
            }
            if (action === 'optimize') {
                setIsOptimizing(true)
            } else {
                setIsUpdating(true)
            }
            try {
                
                const response = await optimizeRouteService.optimizeRoute(optimizationPayload)
                const optimizedRoute = response.data?.route
                if (!optimizedRoute) {
                    throw new Error('Optimizer response did not include a route.')
                }
                applyOptimizedRoute(optimizedRoute)
                showMessage({
                    status: response.status ?? 200,
                    message: response.message ?? 'Route optimized successfully.',
                })
                const latestOptimization = Array.isArray(optimizedRoute.saved_optimizations)
                    ? optimizedRoute.saved_optimizations[optimizedRoute.saved_optimizations.length - 1]
                    : optimizedRoute.saved_optimizations
                const skippedCount = latestOptimization?.skipped_shipments?.length ?? 0
                if (skippedCount > 0) {
                    showMessage({
                        status: 'warning',
                        message: `${skippedCount} shipment${skippedCount === 1 ? '' : 's'} skipped during optimization.`,
                    })
                }
            } catch (error) {
                const status = error instanceof ApiError ? error.status : 'error'
                const message =
                    error instanceof ApiError && error.message
                        ? error.message
                        : 'Failed to optimize the route. Please try again.'
                showMessage({ status, message })
            } finally {
                if (action === 'optimize') {
                    setIsOptimizing(false)
                } else {
                    setIsUpdating(false)
                }
            }
        },
        [applyOptimizedRoute, optimizeRouteService, optimizationPayload, showMessage],
    )

    const handleOptimizeRoute = useCallback(() => handleOptimizationRequest('optimize'), [handleOptimizationRequest])
    const handleUpdateOptimization = useCallback(() => handleOptimizationRequest('update'), [handleOptimizationRequest])

    return (
        <div className="space-y-6 py-4">
            

            <CollapsibleSection title="Optimization Settings" defaultOpen>
                <div className="space-y-4">
                    <Field label="Objective">
                        <DropDown
                            options={objectiveOptions}
                            state={[objective, setObjective]}
                            placeholder="Select objective"
                        />
                    </Field>
                    <OptimizationSetting
                        title="Traffic Matters"
                        description="Consider traffic conditions in route optimization"
                        checked={considerTraffic}
                        onToggle={() => setConsiderTraffic((prev) => !prev)}
                    />
                    <OptimizationSetting
                        title="Road Side Matters"
                        description="Prioritize stops on the same side of the road"
                        checked={sideOfRoad}
                        onToggle={() => setSideOfRoad((prev) => !prev)}
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Route Modifiers">
                <div className="space-y-4">
                    {(Object.keys(routeModifiers) as RouteModifierKey[]).map((key) => (
                        <OptimizationSetting
                            key={key}
                            title={routeModifierLabels[key].title}
                            description={routeModifierLabels[key].description}
                            checked={routeModifiers[key]}
                            onToggle={() =>
                                setRouteModifiers((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                }))
                            }
                        />
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Vehicle Type">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <TruckIcon className="app-icon h-5 w-5 text-[var(--color-muted)]" />
                        <span className="font-medium capitalize">{vehicleType}</span>
                    </div>
                    <Field label="Select the vehicle type for route optimization">
                        <DropDown
                            options={vehicleOptions}
                            state={[vehicleType, setVehicleType]}
                            placeholder="Choose vehicle"
                        />
                    </Field>
                </div>
            </CollapsibleSection>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex items-start gap-2">
                    <InfoIcon className="app-icon mt-0.5 h-4 w-4" />
                    <div>
                        <p className="font-semibold">Tip</p>
                        <p>{tipMessage}</p>
                    </div>
                </div>
            </section>

            <div className="space-y-3">
                <BasicButton
                    params={{
                        variant: 'primary',
                        onClick: handleOptimizeRoute,
                        disabled:isOptimizing || !optimizationPayload,
                    className: 'w-full bg-[#16a34a] border-[#16a34a] text-white disabled:opacity-50',
                }}
            >
                <div className="flex items-center justify-center gap-2 font-semibold">
                    <ThunderIcon className="app-icon h-4 w-4 text-white" />
                    {isOptimizing ? 'Optimizing…' : 'Optimize Route'}
                </div>
            </BasicButton>
                <BasicButton
                    params={{
                        variant: 'secondary',
                        onClick: handleUpdateOptimization,
                        disabled:isUpdating || !optimizationPayload,
                        className: 'w-full',
                    }}
                >
                    {isUpdating ? 'Updating…' : 'Update Optimization'}
                </BasicButton>
            </div>
        </div>
    )
}

export default RouteOptimizationSection

interface OptimizationSettingProps {
    title: string
    description: string
    checked: boolean
    onToggle: () => void
}

function OptimizationSetting({ title, description, checked, onToggle }: OptimizationSettingProps) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-sm">
            <div className="pr-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
                <p className="text-xs text-[var(--color-muted)]">{description}</p>
            </div>
            <ToggleSwitch checked={checked} onClick={onToggle} />
        </div>
    )
}
