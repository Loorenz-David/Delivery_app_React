import React, { useEffect, useMemo, useState } from "react";

import {
  ChevronDownIcon,
  DimensionsIcon,
  LabelIcon,
  LocationIcon,
  WeightIcon,
} from "../../../../assets/icons";

import type { ItemPayload } from '../../types/backend'
import { DropDown } from '../../../../components/buttons/DropDown'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../../resources_manager/managers/DataManager'

type ItemCardVariant = 'default' | 'draft'

interface ItemCardProps {
  item: Partial<ItemPayload> & { id: number }
  onAction?: (action: string, itemId: number, data?: unknown) => void
  variant?: ItemCardVariant
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onAction, variant = 'default' }) => {
  const optionDataManager = useResourceManager('optionDataManager')
  const optionSnapshot = useDataManager(optionDataManager)
  const itemStatesMap = optionSnapshot.dataset?.item_states_map ?? {}
  const itemPositionsMap = optionSnapshot.dataset?.item_positions_map ?? {}
  const itemStateOptions = useMemo(
    () =>
      (optionSnapshot.dataset?.item_states ?? []).map((state) => ({
        value: state.id,
        display: (
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: state.color ?? '#94a3b8' }}
            />
            <span>{state.name}</span>
          </span>
        ),
      })),
    [optionSnapshot.dataset?.item_states],
  )
  const itemPositionOptions = useMemo(
    () => (optionSnapshot.dataset?.item_positions ?? []).map((position) => ({ value: position.id, display: position.name })),
    [optionSnapshot.dataset?.item_positions],
  )
  const [expanded, setExpanded] = useState(false);
  const normalizedStateId = typeof item.item_state_id === 'number' ? item.item_state_id : undefined
  const normalizedPositionId = typeof item.item_position_id === 'number' ? item.item_position_id : undefined
  const resolvedState = normalizedStateId != null ? itemStatesMap?.[normalizedStateId] ?? undefined : undefined
  const resolvedPosition = normalizedPositionId != null ? itemPositionsMap?.[normalizedPositionId] ?? undefined : undefined
  const itemStateColor = resolvedState?.color ?? '#94a3b8'
  const itemStateName = resolvedState?.name ?? 'Pending'
  const itemPosition = resolvedPosition?.name ?? 'Unassigned'
  const [stateSelection, setStateSelection] = useState<number | undefined>(normalizedStateId)
  const [positionSelection, setPositionSelection] = useState<number | undefined>(normalizedPositionId)
  const propertyEntries = useMemo(
    () =>
      Object.entries(item.properties ?? {}).filter(
        ([, value]) => value !== null && value !== undefined && String(value).trim() !== '',
      ),
    [item.properties],
  )
  useEffect(() => {
    setStateSelection(normalizedStateId)
  }, [normalizedStateId])
  useEffect(() => {
    setPositionSelection(normalizedPositionId)
  }, [normalizedPositionId])
  const handleStateSelection = (value: unknown) => {
    if (typeof value === 'undefined' || value === null) {
      return
    }
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
      return
    }
    setStateSelection(numericValue)
    onAction?.('change_state', item.id, { item_state_id: numericValue })
  }
  const handlePositionSelection = (value: unknown) => {
    if (typeof value === 'undefined' || value === null) {
      return
    }
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
      return
    }
    setPositionSelection(numericValue)
    onAction?.('change_position', item.id, { item_position_id: numericValue })
  }
  const itemTypeName =
    typeof item?.item_type === 'string'
      ? item.item_type
      : item?.item_type?.name ?? 'New item'
  const weightLabel = item.weight ?? 'N/A'
  const dimensionsLabel = item.dimensions
    ? `${item.dimensions.length_cm ?? '-'}×${item.dimensions.width_cm ?? '-'}×${item.dimensions.height_cm ?? '-'} cm`
    : '—'

  return (
    <div
      className={`w-full border border-gray-200 rounded-lg shadow-sm bg-white transition-all duration-300 ${
        expanded ? "p-4" : "p-3"
      }`}
    >
      {/* Header (clickable to expand/fold) */}
      <div
        className="flex flex-col gap-1 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-1 justify-between items-center">
          <div className="flex items-center gap-3">
            {/* <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600"
            >
              <FaBoxOpen className="text-lg" />
            </div> */}
            <div>
              <p className="font-semibold text-gray-800">{itemTypeName}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {variant === 'default' ? (
              <span
                className="flex items-center gap-1 text-xs font-medium text-gray-700"
                style={{
                  backgroundColor: `${itemStateColor}20`,
                  color: itemStateColor,
                  border: `1px solid ${itemStateColor}`,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "9999px",
                }}
              >
                {itemStateName}
              </span>
            ) : (
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                onClick={(event) => {
                  event.stopPropagation()
                  onAction?.("edit", item.id)
                }}
              >
                Edit
              </button>
            )}
            <div>
              <ChevronDownIcon className={`app-icon h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
              <div className="flex flex-1 gap-2 items-center">
                  <LabelIcon className="app-icon h-3 w-3 text-gray-400" />
                  <p className="text-[13px] text-gray-500">{item.article_number ?? '---'}</p>
              </div>
              <div className="flex flex-1 gap-2 items-center">
                  <LocationIcon className="app-icon h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">{itemPosition}</p>
              </div>
        </div>
        
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          <div
            className="mt-4 space-y-2 text-sm text-gray-700"
           
          >

            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <WeightIcon className="app-icon h-3 w-3 text-gray-400" />
                Weight:
              </span>
              <span>{weightLabel} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <DimensionsIcon className="app-icon h-3 w-3 text-gray-400" />
                Dimensions:
              </span>
              <span>{dimensionsLabel}</span>
            </div>
            {propertyEntries.length ? (
              <div className="pt-1">
                <p className="text-xs font-medium text-gray-500">Properties</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {propertyEntries.map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[13px] text-[var(--color-text)]"
                    >
                      {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div
            className="mt-4 border-t border-gray-100 pt-3 space-y-2 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Buttons row */}
            {variant === 'default' ? (
              <div className="flex flex-col gap-2">

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Item State</p>
                    <DropDown
                      options={itemStateOptions}
                      placeholder={itemStateOptions.length ? 'Select state' : 'States unavailable'}
                      state={[stateSelection, (value) => handleStateSelection(value)]}
                      className="h-10"
                      buttonClassName="gap-2 items-center justify-between rounded-md border border-gray-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Item Position</p>
                    <DropDown
                      options={itemPositionOptions}
                      placeholder={itemPositionOptions.length ? 'Select position' : 'Positions unavailable'}
                      state={[positionSelection, (value) => handlePositionSelection(value)]}
                      className="h-10"
                      buttonClassName="gap-2 items-center justify-between rounded-md border border-gray-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex mt-8">
                    <button
                      onClick={() => onAction?.("edit", item.id)}
                      className="px-3 py-2 w-full rounded-md text-[12px] text-gray-600 border-1 border-gray-300 hover:bg-gray-100 cursor-pointer"
                    >
                      Edit Item
                    </button>
                </div>
              </div>
            ) : (
              <div className="flex ">
                <button
                  onClick={() => onAction?.("delete", item.id)}
                  className=" w-full px-3 py-2 rounded-md text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            )}

            {/* Timestamp row */}
            <div className="text-xs text-gray-400 text-center">
             
            </div>
          </div>
        </>
      )}
    </div>
  );
};
