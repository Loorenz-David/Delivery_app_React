import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ChangeEvent, FormEvent } from 'react'

import type { AddressPayload, RoutePayload } from '../../types/backend'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { AddressPicker } from '../../../../components/buttons/AddressPicker'
import { DropDown } from '../../../../components/buttons/DropDown'

import { Field } from '../../../../components/forms/FieldContainer'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'

import type { AddressPickerOption } from '../../../../components/buttons/AddressPicker'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ApiError } from '../../../../lib/api/ApiClient'
import { CreateRouteService, UpdateRouteService, DeleteRouteService } from '../../api/deliveryService'
import { CalendarIcon, RouteIcon } from '../../../../assets/icons'
import type { RouteCreatePayload } from '../../api/deliveryService'
import {
  ROUTE_MUTABLE_FIELDS,
  buildFormStateFromRoute,
  buildRoutePayloadFromFormState,
  createInitialFormState,
  normalizeAddressPayload,
  areAddressesEqual,
  type RouteFormState,
} from './utils/routeFormHelpers'
import { useHomeStore } from '../../../../store/home/useHomeStore'

type FillRouteMode = 'create' | 'edit'

interface FillRoutePayload {
  mode?: FillRouteMode
  routeId?: number
  deliveryDate?: string
  onComplete?: (route: RoutePayload) => void
}

const fieldContainer = 'custom-field-container'
const fieldInput = 'custom-input'

type EditableField = Exclude<keyof RouteFormState, 'start_location' | 'end_location' | 'client_address' | 'id'>
type LocationField = 'start_location' | 'end_location'

const FillRoute = ({ payload, onClose, setPopupHeader, registerBeforeClose, openConfirm }: ActionComponentProps<FillRoutePayload>) => {
  const mode: FillRouteMode = payload?.mode ?? (payload?.routeId ? 'edit' : 'create')
  const targetRouteId = payload?.routeId ?? null

  const [formState, setFormState] = useState<RouteFormState>(() => createInitialFormState(payload?.deliveryDate))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showMessage } = useMessageManager()
  const routes = useHomeStore((state) => state.routes)
  const drivers = useHomeStore((state) => state.drivers)
  const defaultWarehouses = useHomeStore((state) => state.defaultWarehouses)
  const { findRouteById, upsertRoute, removeRoute, selectRoute, selectOrder } = useHomeStore.getState()

  const createRouteService = useMemo(() => new CreateRouteService(), [])
  const updateRouteService = useMemo(() => new UpdateRouteService(), [])
  const deleteRouteService = useMemo(() => new DeleteRouteService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])

  const startLocationWarning = useInputWarning('Please choose an address from the dropdown.')
  const endLocationWarning = useInputWarning('Please choose an address from the dropdown.')

  const warehouses = defaultWarehouses ?? []

  const headerContent = useMemo(() => <FillRouteHeader mode={mode} />, [mode])

  const driversOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        value: driver.id,
        display: <DriverOption username={driver.username} profilePicture={driver.profile_picture} />,
      })),
    [drivers],
  )

  const warehousesOptions = useMemo<AddressPickerOption[]>(
    () =>
      warehouses.map((warehouse) => ({
        label: warehouse.name,
        value: normalizeAddressPayload(warehouse.location),
      })),
    [warehouses],
  )

  const routeFromDataset = useMemo(() => {
    if (mode !== 'edit' || targetRouteId == null) {
      return null
    }
    return findRouteById(targetRouteId)
  }, [findRouteById, mode, targetRouteId, routes])

  const derivedRouteFormState = useMemo(() => {
    if (mode !== 'edit' || !routeFromDataset) {
      return null
    }
    return buildFormStateFromRoute(routeFromDataset)
  }, [mode, routeFromDataset])

  const normalizedChangedFields = useMemo(() => {
    if (mode !== 'edit' || !derivedRouteFormState) {
      return null
    }
    const changed: Partial<RouteCreatePayload> = {}
    ROUTE_MUTABLE_FIELDS.forEach((field) => {
      const previous = derivedRouteFormState[field]
      const current = formState[field]
      const isAddressField = field === 'start_location' || field === 'end_location'
      const hasChanged = isAddressField ? !areAddressesEqual(previous as AddressPayload | null, current as AddressPayload | null) : previous !== current
      if (hasChanged) {
        ;(changed as Record<string, unknown>)[field] = current ?? null
      }
    })
    return Object.keys(changed).length ? changed : null
  }, [derivedRouteFormState, formState, mode])

  const updateField =
    (field: EditableField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target
      if (field === 'arrival_time_range') {
        const numericValue = Number(value)
        setFormState((prev) => ({ ...prev, arrival_time_range: Number.isNaN(numericValue) ? null : numericValue }))
        return
      }
      setFormState((prev) => ({ ...prev, [field]: value }))
    }

  const handleTimeChange = (field: 'set_start_time' | 'set_end_time') => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setFormState((prev) => ({ ...prev, [field]: value ? value : null }))
  }

  const performDeleteRoute = useCallback(async () => {
    if (targetRouteId == null) {
      showMessage({ status: 400, message: 'Route identifier is missing.' })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await deleteRouteService.deleteRoute({ id: targetRouteId })
      removeRoute(targetRouteId)
      selectOrder(null)
      selectRoute(null)
      showMessage({
        status: response.status ?? 200,
        message: response.message ?? 'Route deleted successfully.',
      })
      onClose()
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const message =
        error instanceof ApiError && error.message ? error.message : 'Failed to delete the route. Please try again.'
      showMessage({ status, message })
    } finally {
      setIsSubmitting(false)
    }
  }, [deleteRouteService, onClose, removeRoute, selectOrder, selectRoute, showMessage, targetRouteId])

  const handleDeleteRoute = useCallback(() => {
    if (!openConfirm) {
      void performDeleteRoute()
      return
    }
    openConfirm({
      message: 'Deleting this route will also delete all orders and items within it. This action cannot be undone. Continue?',
      onConfirm: performDeleteRoute,
      confirmLabel: 'Delete Route',
      cancelLabel: 'Cancel',
    })
  }, [openConfirm, performDeleteRoute])

  const handleLocationChange = useCallback((field: LocationField, selection: AddressPayload | null) => {
    setFormState((prev) => {
      const current = prev[field]
      if (areAddressesEqual(current, selection)) {
        return prev
      }
      return { ...prev, [field]: selection }
    })
  }, [])

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault()

      
      if (isSubmitting) {
        return
      }
      if (mode === 'edit' && (!normalizedChangedFields || Object.keys(normalizedChangedFields).length === 0)) {
        showMessage({ status: 'info', message: 'No changes detected.' })
        return
      }

      setIsSubmitting(true)
      try {
        if (mode === 'edit') {
          if (targetRouteId == null || !normalizedChangedFields) {
            throw new Error('Missing route identifier for update.')
          }
          const response = await updateRouteService.updateRoute({
            id: targetRouteId,
            fields: normalizedChangedFields,
          })
          const resolvedRoute = responseManager.resolveEntityFromResponse<RoutePayload>(response.data)
          const baseRoute = routeFromDataset ?? resolvedRoute ?? null
          if (!baseRoute) {
            throw new Error('Unable to resolve route to update.')
          }
          const mergedRoute: RoutePayload = {
            ...baseRoute,
            ...(resolvedRoute ?? {}),
            ...normalizedChangedFields,
            start_location: (
              (normalizedChangedFields.start_location as AddressPayload | null | undefined) ?? baseRoute.start_location
            ) as AddressPayload,
            end_location: (
              (normalizedChangedFields.end_location as AddressPayload | null | undefined) ?? baseRoute.end_location
            ) as AddressPayload,
            id: (resolvedRoute?.id as number | undefined) ?? targetRouteId,
            route_label:
              (resolvedRoute as RoutePayload | undefined)?.route_label ??
              baseRoute.route_label ??
              (normalizedChangedFields.route_label as string | undefined) ??
              '',
            delivery_date:
              (resolvedRoute as RoutePayload | undefined)?.delivery_date ??
              baseRoute.delivery_date ??
              (normalizedChangedFields.delivery_date as string | undefined) ??
              '',
            saved_optimizations: (
              (resolvedRoute as RoutePayload | undefined)?.saved_optimizations ?? baseRoute.saved_optimizations
            ) as RoutePayload['saved_optimizations'],
            state_id: (
              (resolvedRoute as RoutePayload | undefined)?.state_id ??
              (normalizedChangedFields.state_id as number | undefined) ??
              baseRoute.state_id
            ) as number,
            route_state: (
              (resolvedRoute as RoutePayload | undefined)?.route_state ?? baseRoute.route_state
            ) as RoutePayload['route_state'],
            is_optimized:
              (resolvedRoute as RoutePayload | undefined)?.is_optimized ??
              baseRoute.is_optimized ??
              false,
            delivery_orders:
              (resolvedRoute as RoutePayload | undefined)?.delivery_orders ?? baseRoute.delivery_orders ?? [],
          }
          upsertRoute(mergedRoute)
          selectRoute(mergedRoute.id, { routeId: mergedRoute.id }, mergedRoute)
          payload?.onComplete?.(mergedRoute)
          showMessage({
            status: response.status ?? 200,
            message: response.message ?? 'Route updated successfully.',
          })
          onClose()
        } else {
          const sanitizedPayload = responseManager.sanitizePayload<RouteFormState & Record<string, unknown>>(
            formState as RouteFormState & Record<string, unknown>,
            {
              omitKeys: ['id'],
            },
          ) as RouteCreatePayload
          const response = await createRouteService.createRoute(sanitizedPayload)
          const resolvedRoute = responseManager.resolveEntityFromResponse<RoutePayload>(response.data)
          const fallbackRoute = buildRoutePayloadFromFormState(
            {
              ...formState,
            id: (resolvedRoute?.id as number | undefined) ?? undefined,
          },
          null,
        )
          const mergedRoute = responseManager.mergeWithFallback(resolvedRoute, fallbackRoute)
          upsertRoute(mergedRoute)
          selectRoute(mergedRoute.id, { routeId: mergedRoute.id }, mergedRoute)
          selectOrder(null)
          payload?.onComplete?.(mergedRoute)
          showMessage({
            status: response.status ?? 200,
            message: response.message ?? 'Route created successfully.',
          })
          onClose()
        }
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 500
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : 'Failed to submit the route. Please try again.'
        showMessage({ status, message })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      createRouteService,
      formState,
      isSubmitting,
      mode,
      normalizedChangedFields,
      onClose,
      routeFromDataset,
      responseManager,
      selectOrder,
      selectRoute,
      showMessage,
      targetRouteId,
      upsertRoute,
      updateRouteService,
    ],
  )

  // const _hasValidStart = Boolean(formState.start_location)
  // const _hasValidEnd = Boolean(formState.end_location)
  // const _hasValidRange =
  //   typeof formState.arrival_time_range === 'number' && !Number.isNaN(formState.arrival_time_range) && formState.arrival_time_range >= 0
  const isFormValid = formState.route_label.trim() !== '' && Boolean(formState.delivery_date)
  const hasChanges = mode === 'create' || Boolean(normalizedChangedFields && Object.keys(normalizedChangedFields).length)
  const isSubmitDisabled = isSubmitting || !isFormValid || !hasChanges

  useEffect(() => {
    if (mode === 'create') {
      setFormState(createInitialFormState(payload?.deliveryDate))
    }
    else if (mode === 'edit' && derivedRouteFormState) {
      setFormState(derivedRouteFormState)
    }
  }, [mode, derivedRouteFormState, payload?.deliveryDate])


  useEffect(() => {
    setPopupHeader?.(headerContent)
    return () => setPopupHeader?.(null)
  }, [headerContent, setPopupHeader])

  useEffect(() => {
    if (!registerBeforeClose) {
      return
    }
    registerBeforeClose({
      shouldWarn: () =>
        mode === 'edit' && normalizedChangedFields ? Object.keys(normalizedChangedFields).length > 0 : false,
      onSave: async () => {
        await handleSubmit()
      },
      message: 'You have unsaved changes to this route. Would you like to save them before closing?',
      saveLabel: 'Save',
      discardLabel: 'Discard',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, mode, normalizedChangedFields, registerBeforeClose])

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Field label="Route Label" required>
          <div className={fieldContainer}>
            <input
              className={fieldInput}
              placeholder="e.g., North Route A"
              value={formState.route_label}
              onChange={updateField('route_label')}
            />
          </div>
        </Field>

        <Field label="Delivery Date" required>
          <div className={fieldContainer}>
            <CalendarIcon className="app-icon h-4 w-4 text-[var(--color-muted)]" />
            <input type="date" className={fieldInput} value={formState.delivery_date} onChange={updateField('delivery_date')} />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start Time">
            <div className={fieldContainer}>
              <input
                type="time"
                className={fieldInput}
                value={formState.set_start_time ?? ''}
                onChange={handleTimeChange('set_start_time')}
              />
            </div>
          </Field>
          <Field label="End Time">
            <div className={fieldContainer}>
              <input
                type="time"
                className={fieldInput}
                value={formState.set_end_time ?? ''}
                onChange={handleTimeChange('set_end_time')}
              />
            </div>
          </Field>
        </div>

        <Field label="Delivery Time Range (minutes)">
          <div className={fieldContainer}>
            <input
              type="number"
              min="0"
              step="5"
              className={fieldInput}
              value={formState.arrival_time_range ?? ''}
              onChange={updateField('arrival_time_range')}
              placeholder="e.g., 30"
            />
          </div>
        </Field>

        <Field label="Assign Driver">
          <DropDown
            options={driversOptions}
            className={fieldContainer}
            buttonClassName="gap-2 items-center justify-between"
            placeholder="Select a driver"
            state={[
              formState.driver_id ?? undefined,
              (value) => {
                if (value == null || value === '') {
                  setFormState((prev) => ({ ...prev, driver_id: null }))
                  return
                }
                const numericValue = typeof value === 'number' ? value : Number(value)
                setFormState((prev) => ({ ...prev, driver_id: Number.isNaN(numericValue) ? null : numericValue }))
              },
            ]}
          />
        </Field>

        <Field label="Start Location"  warning={startLocationWarning.warning}>
          <AddressPicker
            field="start_location"
            selection={formState.start_location}
            options={warehousesOptions}
            onSelectionChange={handleLocationChange}
            placeholder="Search start address"
            warningController={startLocationWarning}
          />
        </Field>

        <Field label="End Location"  warning={endLocationWarning.warning}>
          <AddressPicker
            field="end_location"
            selection={formState.end_location}
            options={warehousesOptions}
            onSelectionChange={handleLocationChange}
            placeholder="Search end address"
            warningController={endLocationWarning}
          />
        </Field>
      </div>

      <div className="flex justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        {mode === 'edit' ? (
          <BasicButton
            params={{
              variant: 'ghost',
              className: 'text-red-600 hover:text-red-700',
              onClick: handleDeleteRoute,
              disabled: isSubmitting,
            }}
          >
            Delete Route
          </BasicButton>
        ) : <span />}
      
        <BasicButton
          params={{
            variant: 'primary',
            type: 'submit',
            disabled: isSubmitDisabled,
          }}
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Route' : 'Create Route'}
        </BasicButton>
      </div>
    </form>
  )
}

export default FillRoute

function FillRouteHeader({ mode }: { mode: FillRouteMode }) {
  const title = mode === 'edit' ? 'Update Route' : 'Create New Route'
  const subtitle =
    mode === 'edit'
      ? 'Review and adjust the details below to update this delivery route.'
      : 'Fill in the details below to create a new delivery route.'
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-primary)]">
        <RouteIcon className="app-icon h-5 w-5 text-[var(--color-primary)]" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-sm text-[var(--color-muted)]">{subtitle}</p>
      </div>
    </div>
  )
}

function DriverOption({ username, profilePicture }: { username: string; profilePicture?: string | null }) {
  const initials = username.charAt(0).toUpperCase()
  return (
    <span className="flex items-center gap-2 p-1">
      <ProfilePicture src={profilePicture} initials={initials} size={24} />
      <span className="truncate">{username}</span>
    </span>
  )
}
