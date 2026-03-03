import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BackArrowIcon2 } from '@/assets/icons'

import {
  CostumerFormEmbedded,
  CostumerSearchBar,
  type Costumer,
} from '@/features/costumer'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { ThreeDotMenu, type ThreeDotMenuOption } from '@/shared/buttons/ThreeDotMenu'
import type { CostumerFormPayload } from '@/features/costumer/forms/costumerForm/state/CostumerForm.types'

import type { DesktopLayoutMode } from './OrderFormDesktop.layout'
import type {
  CostumerSelectionRequestResult,
  CostumerSelectionSource,
} from '../state/OrderForm.types'
import { OpeningHoursPreview } from './OrderFormCostumerOpeningHoursPreview'

export type OrderFormCustomerPanelView = 'search' | 'details' | 'form-create' | 'form-edit'
type NonFormView = Extract<OrderFormCustomerPanelView, 'search' | 'details'>

export const resolveCustomerPanelInitialView = (costumer?: Costumer | null): NonFormView =>
  costumer ? 'details' : 'search'

export const resolveCustomerPanelViewForEdit = (costumer?: Costumer | null): OrderFormCustomerPanelView =>
  costumer?.client_id ? 'form-edit' : 'search'

export const resolveCustomerPanelViewAfterFormClose = ({
  previousView,
  hasSelectedCostumer,
}: {
  previousView: NonFormView
  hasSelectedCostumer: boolean
}): NonFormView => {
  if (previousView === 'details' && !hasSelectedCostumer) {
    return 'search'
  }

  return previousView
}

export const shouldShowCostumerSearchBar = (view: OrderFormCustomerPanelView) => view === 'search'
export const shouldShowCostumerSearchBackAction = ({
  view,
  hasSelectedCostumer,
}: {
  view: OrderFormCustomerPanelView
  hasSelectedCostumer: boolean
}) => view === 'search' && hasSelectedCostumer
export const shouldShowCostumerDetailsMenu = (view: OrderFormCustomerPanelView) => view === 'details'

export const resolveExpandedCustomerLayoutMode = (): DesktopLayoutMode => 'customer-expanded'
export const resolveDefaultCustomerLayoutMode = (): DesktopLayoutMode => 'default'

const isFormView = (view: OrderFormCustomerPanelView): view is Extract<OrderFormCustomerPanelView, 'form-create' | 'form-edit'> =>
  view === 'form-create' || view === 'form-edit'

type OrderFormCustomerPanelProps = {
  costumer?: Costumer | null
  onSelectCostumer?: (
    costumer: Costumer,
    source?: CostumerSelectionSource,
  ) => CostumerSelectionRequestResult
  layoutMode?: DesktopLayoutMode
  setLayoutMode?: (value: DesktopLayoutMode) => void
}

const formatPhone = (costumer: Costumer): string => {
  const primary = costumer.default_primary_phone?.phone
  if (!primary?.number) {
    return '-'
  }

  return `${primary.prefix ?? ''} ${primary.number}`.trim()
}

const formatAddress = (costumer: Costumer): string => {
  return costumer.default_address?.address?.street_address ?? '-'
}

const formatFullName = (costumer: Costumer): string => {
  return `${costumer.first_name} ${costumer.last_name}`.trim()
}

export const OrderFormCustomerPanel = ({
  costumer = null,
  onSelectCostumer,
  setLayoutMode,
}: OrderFormCustomerPanelProps) => {
  const [panelView, setPanelView] = useState<OrderFormCustomerPanelView>(
    resolveCustomerPanelInitialView(costumer),
  )
  const previousNonFormViewRef = useRef<NonFormView>(resolveCustomerPanelInitialView(costumer))

  useEffect(() => {
    if (!costumer && panelView === 'details') {
      setPanelView('search')
    }
  }, [costumer, panelView])

  useEffect(() => {
    if (!isFormView(panelView)) {
      previousNonFormViewRef.current = panelView
    }
  }, [panelView])

  useEffect(() => {
    if (panelView !== 'form-edit') {
      return
    }

    if (!costumer?.client_id) {
      setPanelView('search')
      setLayoutMode?.(resolveDefaultCustomerLayoutMode())
    }
  }, [costumer?.client_id, panelView, setLayoutMode])

  const panelShell = (
    content: ReactNode,
    options?: { hidePanelTitle?: boolean; headerAction?: ReactNode },
  ) => (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-page)]"
    >
      {!options?.hidePanelTitle ? (
        <div className="flex items-center justify-between w-full px-4 pb-3 pt-3">
          <span className="text-[12px] font-semibold">Costumer</span>
          {options?.headerAction ?? null}
        </div>
      ) : null}
      {content}
    </div>
  )

  const handleStartCreate = () => {
    setPanelView('form-create')
    setLayoutMode?.(resolveExpandedCustomerLayoutMode())
  }

  const handleStartEdit = () => {
    const nextView = resolveCustomerPanelViewForEdit(costumer)
    setPanelView(nextView)
    if (nextView === 'form-edit') {
      setLayoutMode?.(resolveExpandedCustomerLayoutMode())
    }
  }

  const handleChangeCostumer = () => {
    setPanelView('search')

    setLayoutMode?.(resolveDefaultCustomerLayoutMode())
  }

  const handleBackToDetails = () => {
    if (!costumer) {
      return
    }

    setPanelView('details')
    setLayoutMode?.(resolveDefaultCustomerLayoutMode())
  }

  const handleSelectionResult = (
    result: CostumerSelectionRequestResult | undefined,
  ) => {
    if (result === 'ignored') {
      return
    }

    setPanelView('details')
    setLayoutMode?.(resolveDefaultCustomerLayoutMode())
  }

  const handleSearchSelect = (entry: Costumer) => {
    const result = onSelectCostumer?.(entry, 'panel')
    handleSelectionResult(result)
  }

  const handleEmbeddedClose = () => {
    const nextView = resolveCustomerPanelViewAfterFormClose({
      previousView: previousNonFormViewRef.current,
      hasSelectedCostumer: Boolean(costumer),
    })

    setPanelView(nextView)
    setLayoutMode?.(resolveDefaultCustomerLayoutMode())
  }

  const handleEmbeddedSaved = (savedCostumer: Costumer) => {
    const result = onSelectCostumer?.(savedCostumer, 'embedded')
    handleSelectionResult(result)
  }

  const detailsMenuOptions: ThreeDotMenuOption[] = useMemo(
    () => [
      {
        label: 'Change Costumer',
        action: handleChangeCostumer,
      },
      {
        label: 'Edit Costumer',
        action: handleStartEdit,
      },
    ],
    [handleChangeCostumer, handleStartEdit],
  )

  const embeddedFormPayload = useMemo<CostumerFormPayload | undefined>(() => {
    if (panelView === 'form-create') {
      return { mode: 'create' }
    }

    if (panelView === 'form-edit' && costumer?.client_id) {
      return {
        mode: 'edit',
        clientId: costumer.client_id,
      }
    }

    return undefined
  }, [costumer?.client_id, panelView])



  if (panelView === 'form-create' || panelView === 'form-edit') {
    return panelShell(
      <div className="flex h-full min-h-0 flex-1 overflow-hidden ">
        <CostumerFormEmbedded
          payload={embeddedFormPayload}
          headerTitle={panelView === 'form-create' ? 'Create Costumer' : 'Edit Costumer'}
          headerSubtitle={
            panelView === 'form-create'
              ? 'Add a new costumer profile.'
              : 'Update costumer details.'
          }
          closeLabel="Back"
          onRequestClose={handleEmbeddedClose}
          onSavedCostumer={handleEmbeddedSaved}
        />
      </div>,
      { hidePanelTitle: true },
    )
  }

  if (shouldShowCostumerSearchBar(panelView)) {
    return panelShell(
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <CostumerSearchBar 
          onSelectCostumer={handleSearchSelect} 
          handleStartCreate={handleStartCreate}
        />

      </div>,
      {
        headerAction: shouldShowCostumerSearchBackAction({
          view: panelView,
          hasSelectedCostumer: Boolean(costumer),
        }) ? (
          <BasicButton
            params={{
              variant: 'ghost',
              onClick: handleBackToDetails,
              className: 'flex items-center gap-1 px-1 py-1 text-[11px] text-[var(--color-muted)]',
              ariaLabel: 'Back to selected costumer',
            }}
          >
            <BackArrowIcon2 className="h-3.5 w-3.5" />
            Back
          </BasicButton>
        ) : undefined,
      },
    )
  }

  if (!costumer) {
    return panelShell(
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <span className="text-[14px] text-[var(--color-muted)]">No costumer selected.</span>
        <div className="flex items-center justify-end">
          <BasicButton
            params={{
              variant: 'secondary',
              onClick: () => setPanelView('search'),
              className: 'px-3 py-2 text-xs',
              ariaLabel: 'Search costumer',
            }}
          >
            Search Costumer
          </BasicButton>
        </div>
      </div>,
    )
  }

  return panelShell(
    <div className="flex flex-col  px-4 pb-4">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <DisplayInfo label="Name:" value={formatFullName(costumer)} />
          <DisplayInfo label="Email:" value={costumer.email ?? '-'} />
          <DisplayInfo label="Phone:" value={formatPhone(costumer)} />
        </div>
        <div className="flex justify-end">
          {costumer.operating_hours ?
            <div className="border-b-1 border-[var(--color-border)]">
              <OpeningHoursPreview costumerOperatingHours = {costumer.operating_hours}/>
            </div>

            : null
          }
        </div>

      </div>
      <DisplayInfo label="Address:" value={formatAddress(costumer)} />
    </div>,
    {
      headerAction: shouldShowCostumerDetailsMenu(panelView) ? (
          <div>
              <ThreeDotMenu
                dotWidth={3}
                dotHeight={3}
                dotClassName="bg-[var(--color-muted)]"
                triggerClassName="flex h-5 w-5 cursor-pointer items-center justify-center  "
                options={detailsMenuOptions}
                width={190}
              />
          </div>
        ) : undefined,
    },
  )
}

const DisplayInfo = ({
  label,
  value,
}: {
  label: string
  value: string
}) => {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</span>
      <div className="flex gap-1 text-[14px]">
        <span>{value}</span>
      </div>
    </div>
  )
}
