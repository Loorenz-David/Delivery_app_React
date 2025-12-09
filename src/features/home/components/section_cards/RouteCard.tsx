import React from "react";

import {
  CheckMarkIcon,
  DimensionsIcon,
  DistanceIcon,
  ItemIcon,
  OrderIcon,
  TimeIcon,
  TruckIcon,
  WeightIcon,
} from "../../../../assets/icons";
import type { RoutePayload } from '../../types/backend'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'

export interface RouteInfo {
  id: number;
  name: string;
  driver: string;
  status: "Pending" | "Completed" | "In Progress";
  duration: string;
  distance: string;
  weight: string;
  items: number;
  orders: number;
  optimized: boolean;
}

interface RouteCardProps {
  route: RoutePayload;
  onSelect?: (route: RoutePayload) => void;
  compact?: boolean;
  onRouteDragOver?: (event: React.DragEvent<HTMLDivElement>, route: RoutePayload) => void
  onRouteDrop?: (event: React.DragEvent<HTMLDivElement>, route: RoutePayload) => void
}


// missing to fix the stats for each route, each route has a list of optimizations which will give some 
// info about completion times.
// the quantities and weights will be derive from the orders and items with in the payload passed

export const RouteCard: React.FC<RouteCardProps> = ({ route, onSelect, compact = false, onRouteDragOver, onRouteDrop }) => {
  const optionDataManager = useResourceManager('optionDataManager')
  const dependencies = optionDataManager.getDataset()
  const driverId = route.driver_id ?? null
  const routeStateId = route.state_id ?? route.route_state?.id ?? null
  const driver =
    (driverId != null ? dependencies?.drivers_map?.[driverId] : null) ?? route.driver ?? null
  const routeState =
    (routeStateId != null ? dependencies?.route_states_map?.[routeStateId] : null) ?? route.route_state ?? null
  const totalDistance = formatDistance(route.total_distance_meters)
  const totalDuration = formatDuration(route.total_duration_seconds)
  const totalWeight = formatWeight(route.total_weight)
  const totalVolume = formatVolume(route.total_volume)
  const totalItems = route.total_items ?? route.delivery_orders?.reduce((sum, order) => sum + (order.delivery_items?.length ?? 0), 0) ?? 0
  const totalOrders = route.total_orders ?? route.delivery_orders?.length ?? 0

  if (compact) {
    return (
      <div
        className="w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md cursor-pointer"
        onClick={() => onSelect?.(route)}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onDragOver={onRouteDragOver ? (event) => onRouteDragOver(event, route) : undefined}
        onDrop={onRouteDrop ? (event) => onRouteDrop(event, route) : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <TruckIcon className="stroke-current h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{route.route_label}</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-600">
              <span className="truncate">{driver?.username ?? 'Unassigned'}</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <OrderIcon className="app-icon h-3.5 w-3.5 text-gray-500" />
                  {totalOrders}
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <ItemIcon className="app-icon h-3.5 w-3.5 text-gray-500" />
                  {totalItems}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer"
      onClick={() => onSelect?.(route)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onDragOver={onRouteDragOver ? (event) => onRouteDragOver(event, route) : undefined}
      onDrop={onRouteDrop ? (event) => onRouteDrop(event, route) : undefined}
      >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <TruckIcon className="stroke-current h-4 w-4 text-blue-400" />
          </div>
          {/* <TruckIcon className="stroke-current mt-1 h-5 w-5 text-blue-400" /> */}
          <div>
            <h2 className="font-semibold text-gray-800 text-base leading-tight">
              {route.route_label}
            </h2>
            <p className="text-sm text-gray-500">{driver?.username ?? 'Unassigned'}</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full border ${
            routeState?.name === "Pending"
              ? "bg-yellow-50 text-yellow-700 border-yellow-300"
              : routeState?.name === "Completed"
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-blue-50 text-blue-700 border-blue-300"
          }`}
        >
          {routeState?.name ?? 'Unknown'}
        </span>
      </div>

      {/* Info row */}
      <div className="mt-4 grid grid-cols-4 items-center gap-2 text-xs text-gray-600">
        <div className="flex items-center justify-center gap-1">
          <TimeIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalDuration}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <DistanceIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalDistance}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <WeightIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalWeight}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <DimensionsIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalVolume}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-3"></div>

      {/* Footer row */}
      <div className="grid grid-cols-3 items-center gap-2 text-xs text-gray-700">
        <div className="flex items-center justify-center gap-1">
          <ItemIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalItems} items</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <OrderIcon className="app-icon h-4 w-4 text-gray-400" />
          <span>{totalOrders} orders</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          {route.is_optimized ? (
            <>
              <CheckMarkIcon className="app-icon h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">Optimized</span>
            </>
          ) : (
            <>
              <CheckMarkIcon className="app-icon h-4 w-4 text-gray-300" />
              <span className="text-gray-400">Not optimized</span>
            </>
          )}
        </div>
      </div>
    </div>

    

  );
};

function formatDistance(value?: number | null) {
  if (!value) {
    return '—'
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`
  }
  return `${value} m`
}

function formatDuration(value?: number | null) {
  if (!value) {
    return '—'
  }
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatWeight(value?: number | null) {
  if (!value) {
    return '—'
  }
  return `${value} kg`
}

function formatVolume(value?: number | null) {
  if (!value) {
    return '—'
  }
  return `${value} cm³`
}
 
