import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { BasicButton } from '@/shared/buttons/BasicButton'
import { AccordionSection } from '@/shared/layout/AccordionSection'
import { CustomDateTimePicker } from '@/shared/inputs/CustomDateTimePicker'
import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { InputWarning } from '@/shared/inputs/InputWarning'
import type { PopoverSelectOption } from '@/shared/inputs/OptionPopoverSelect'
import { OptionPopoverSelect } from '@/shared/inputs/OptionPopoverSelect'
import { PhoneField } from '@/shared/inputs/PhoneField/intex'
import { AddressAutocomplete } from '@/shared/inputs/address-autocomplete/AddressAutocomplete'

import { ItemsOrderPreview } from '../../item/components/ItemsOrderPreview'
import { ItemFormLayout } from '../../item/popups/ItemForm/ItemForm.layout'
import { ItemFormProvider } from '../../item/popups/ItemForm/ItemForm.provider'

import { useOrderForm } from './OrderForm.context'
import { useOrderFormConfig } from './useOrderFormConfig'
import { useOrderFormSetters } from './useOrderFormSetters'
import { OrderFormFooter } from './OrderFormFooter'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { CloseIcon, PlusIcon, SingleOrderIcon } from '@/assets/icons'
import {
  emitExternalFormRequest,
  type ExternalFormReceivedPayload,
} from '@/realtime/externalForm/externalForm.realtime'
import { useExternalFormRealtime } from '@/realtime/externalForm/useExternalFormRealtime'
import { sessionStorage } from '@/featuresV2/auth/login/store/sessionStorage'
import { useMobile } from '@/app/contexts/MobileContext'


type OrderFormSection = 'details' | 'client_information' | 'date_times'

const toDateValue = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const ORDER_PLAN_OBJECTIVE_OPTIONS: Array<PopoverSelectOption<string>> = [
  { label: 'Local delivery', value: 'local_delivery' },
  { label: 'International shipping', value: 'international_shipping' },
  { label: 'Store pickup', value: 'store_pickup' },
]

const ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY = 'orderForm.lastOpenSection'
const SECTION_RESTORE_DELAY_MS = 180
const isBrowser = typeof window !== 'undefined'

const isOrderFormSection = (value: string): value is OrderFormSection =>
  value === 'details' || value === 'client_information' || value === 'date_times'

const persistLastOpenSection = (section: OrderFormSection) => {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY, section)
  } catch {
    // Ignore storage failures to avoid blocking form rendering.
  }
}

const getLastOpenSection = (): OrderFormSection | null => {
  if (!isBrowser) return null
  try {
    const storedSection = window.localStorage.getItem(ORDER_FORM_LAST_OPEN_SECTION_STORAGE_KEY)
    if (!storedSection) return null
    return isOrderFormSection(storedSection) ? storedSection : null
  } catch {
    return null
  }
}

export const OrderFormLayout = () => {
  const {
    mode,
    formState,
    creationDate,
    warnings,
    setFormState,
    handleSave,
    handleDelete,
    initialFormRef,
    visibleItemDrafts,
    isLoadingInitialItems,
    openItemCreateForm,
    openItemEditForm,
    isItemEditorOpen,
    itemEditorPayload,
    closeItemEditor,
  } = useOrderForm()

  const [openSection, setOpenSection] = useState<OrderFormSection | null>(null)
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(
    () => (formState.client_secondary_phone?.number ?? '').trim().length > 0,
  )

  const setters = useOrderFormSetters({
    setFormState,
    warnings,
  })

  useOrderFormConfig({ mode, formState, initialFormRef })
  const {closePopup} = usePopupContext()
  const session = sessionStorage.getSession()
  const employeeUserId = Number(
    session?.user?.id ??
      (session as { userId?: string | number | null } | null)?.userId ??
      -1,
  )

  const handleExternalFormReceived = useCallback(
    (payload: ExternalFormReceivedPayload) => {
      setters.mergeExternalClientData(payload.form_data)
    },
    [setters],
  )

  useExternalFormRealtime({
    userId: employeeUserId,
    onReceived: handleExternalFormReceived,
  })

  const handleSendForm = useCallback(() => {
    if (employeeUserId <= 0) {
      return
    }

    emitExternalFormRequest({
      user_id: employeeUserId,
      request_data: {
        reference_number: formState.reference_number,
      },
    })
  }, [employeeUserId, formState.reference_number])

  const handleShowSecondaryPhone = useCallback(() => {
    setShowSecondaryPhone(true)
  }, [])

  const handleSectionToggle = useCallback((section: OrderFormSection) => {
    setOpenSection((prev) => {
      const nextSection = prev === section ? null : section
      if (nextSection) {
        persistLastOpenSection(nextSection)
      }
      return nextSection
    })
  }, [])

  const handleHideSecondaryPhone = useCallback(() => {
    setShowSecondaryPhone(false)
    setters.handleSecondaryPhone({
      ...formState.client_secondary_phone,
      number: '',
    })
  }, [formState.client_secondary_phone, setters])

  useEffect(() => {
    if ((formState.client_secondary_phone?.number ?? '').trim().length > 0) {
      setShowSecondaryPhone(true)
    }
  }, [formState.client_secondary_phone?.number])

  useEffect(() => {
    const lastSection = getLastOpenSection()
    if (!lastSection) return

    
      setOpenSection(lastSection)


  }, [])

  const label = mode === 'create' ? 'Create Order' : 'Edit Order'

  const {isMobile} = useMobile()



  return (

    <div className={`flex h-full min-h-0 gap-6 ${isMobile ? 'flex-col overflow-y-auto overflow-x-hidden relative pb-10' : 'flex'}`}>
      <div className={`flex min-h-0 flex-col bg-[var(--color-page)]  ${isMobile ? 'w-full shrink-0' : "rounded-xl w-[550px] h-full relative"}`}>
        <header className={
          `flex items-center justify-between gap-4 border-b border-[var(--color-border)] ${isMobile? 'pb-4 px-3': 'px-6 py-4'}` 
        }
        >
          <div className="flex items-center justify-center rounded-full  bg-[var(--color-muted)]/20 p-3 ">
              <SingleOrderIcon className="h-6 w-6 text-[var(--color-muted)] "/>
          </div>
          <div className="flex flex-col gap-1">
              <h2 className=" font-semibold text-[var(--color-text)]">
                 {label}
              </h2>
              {mode === 'edit' ? 
                <div className=" text-xs text-[var(--color-muted)] flex">
                  Creation date:  {creationDate}
                </div>
                :
                <div>

                </div>
              }
              
          </div>
            <div className=" flex items-center justify-end flex-1">
              
              <BasicButton params={{
                  variant: 'rounded',
                  onClick: closePopup,
                  style:{border:'1px solid rgb(var(--color-muted-r), 0.4)'}
              }}
              >
                  <CloseIcon className={"h-6 w-6 app-icon"} />
              </BasicButton>
          </div>
        </header>
        <form className={`flex min-h-0 flex-1 pt-5 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 scroll-thin ${isMobile ? 'pb-3' : 'pb-[100px] h-full'}`}>
          <AccordionSection
            title="Details"
            isOpen={openSection === 'details'}
            onToggle={() => handleSectionToggle('details')}
          >
            <Field label="Reference number:" required={true} warningController={warnings.referenceWarning}>
              <InputField
                value={formState.reference_number}
                onChange={setters.handleReference}
                warningController={warnings.referenceWarning}
              />
            </Field>
            <Field label="External source:">
              <InputField
                value={formState.external_source}
                onChange={setters.handleExternalSource}
              />
            </Field>

            <Field label="Tracking number:">
              <InputField
                value={formState.tracking_number}
                onChange={setters.handleTrackingNumber}
              />
            </Field>

            <Field label="Tracking link:">
              <InputField
                value={formState.tracking_link}
                onChange={setters.handleTrackingLink}
              />
            </Field>
            {formState.delivery_plan_id == null ? (
              <Field label="Order plan objective:" >
                <OptionPopoverSelect
                  options={ORDER_PLAN_OBJECTIVE_OPTIONS}
                  value={formState.order_plan_objective}
                  onChange={setters.handleOrderPlanObjective}
                  placeholder="Select objective"
                  emptyLabel="No objective"
                />
              </Field>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="Client information"
            isOpen={openSection === 'client_information'}
            onToggle={() => handleSectionToggle('client_information')}
          >
            <div className="flex gap-4">
              <Field label="Client first name:" required={true} warningController={warnings.firstNameWarning}>
                <InputField
                  value={formState.client_first_name}
                  onChange={setters.handleFirstName}
                  warningController={warnings.firstNameWarning}
                />
              </Field>

              <Field label="Client last name:" required={true} warningController={warnings.lastNameWarning}>
                <InputField
                  value={formState.client_last_name}
                  onChange={setters.handleLastName}
                  warningController={warnings.lastNameWarning}
                />
              </Field>

            </div>

            <Field label="Client email:" required={true} warningController={warnings.emailWarning}>
              <InputField
                value={formState.client_email}
                onChange={setters.handleEmail}
                warningController={warnings.emailWarning}
              />
            </Field>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Client primary phone:" required={true} warning={warnings.primaryPhoneWarning.warning}>
                  <PhoneField
                    phoneNumber={formState.client_primary_phone}
                    onChange={setters.handlePrimaryPhone}
                  />
                </Field>
              </div>
              {!showSecondaryPhone ? (
                <div className="pb-1">
                  <BasicButton
                    params={{
                      variant: 'rounded',
                      onClick: handleShowSecondaryPhone,
                      ariaLabel: 'Add secondary phone',
                      style: { border: '1px dashed rgb(var(--color-muted-r), 0.5)' },
                    }}
                  >
                    <PlusIcon className="h-4 w-4 app-icon" />
                  </BasicButton>
                </div>
              ) : null}
            </div>

            {showSecondaryPhone ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label="Client secondary phone:">
                    <PhoneField
                      phoneNumber={formState.client_secondary_phone}
                      onChange={setters.handleSecondaryPhone}
                    />
                  </Field>
                </div>
                <div className="pb-1">
                  <BasicButton
                    params={{
                      variant: 'rounded',
                      onClick: handleHideSecondaryPhone,
                      ariaLabel: 'Remove secondary phone',
                      style: { border: '1px dashed rgb(var(--color-muted-r), 0.5)' },
                    }}
                  >
                    <span className="text-lg leading-none text-[var(--color-muted)]">-</span>
                  </BasicButton>
                </div>
              </div>
            ) : null}

            <Field label="Client address:" required={true} warning={warnings.addressWarning.warning}>
              <AddressAutocomplete
                onSelectedAddress={setters.handleAddress}
                selectedAddress={formState.client_address}
              />
            </Field>
          </AccordionSection>

          <AccordionSection
            title="Date & times"
            isOpen={openSection === 'date_times'}
            onToggle={() => handleSectionToggle('date_times')}
          >
            <Field
              label="Earliest delivery date & start time:"
            >
              <CustomDateTimePicker
                date={toDateValue(formState.earliest_delivery_date)}
                onChangeDate={setters.handleEarliestDate}
                selectedTime={formState.preferred_time_start || null}
                onChangeTime={setters.handlePreferredTimeStart}
              />
            </Field>

            <Field
              label="Latest delivery date & end time:"
            >
              <CustomDateTimePicker
                date={toDateValue(formState.latest_delivery_date)}
                onChangeDate={setters.handleLatestDate}
                selectedTime={formState.preferred_time_end || null}
                onChangeTime={setters.handlePreferredTimeEnd}
              />
            </Field>

            {warnings.dateRangeWarning.warning.isVisible ? (
              <InputWarning {...warnings.dateRangeWarning.warning} />
            ) : null}
          </AccordionSection>
          
            
        </form>
       {(!isMobile || !isItemEditorOpen) && (
          <OrderFormFooter
            onSendForm={handleSendForm}
            onSaveOrder={handleSave}
            onDeleteOrder={mode === 'edit' ? () => { void handleDelete() } : undefined}
            sendDisabled={employeeUserId <= 0}
            isMobile={isMobile}
          />
        )}
      </div>
      <motion.div className={`flex min-h-0 bg-[var(--color-page)] overflow-hidden ${isMobile ? 'w-full shrink-0' : "w-[400px] rounded-xl h-full"}`}
        initial={{ x: 120, opacity: 0 }}
        animate={{
                opacity: 1,
                x: 0,
                transition: {
                duration: 0.3,
                ease: 'easeOut',
                delay:0.1,
            },
        }}
        exit={{
            opacity: 0,
            x: 100,
            transition: {
            duration: 0.3,
            ease: 'easeOut',
            },
        }}
      >
            <div className="relative w-full rounded-lg border border-[var(--color-muted)]/20 shadow-sm ">
              <AnimatePresence mode="wait" initial={false}>
                {isItemEditorOpen && itemEditorPayload ? (
                  <motion.div
                    key="item-editor"
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full h-full bg-[var(--color-page)] px-3 pt-4"
                  >
                    <div className="flex flex-col h-full w-full min-w-0">
                      <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {itemEditorPayload.mode == 'controlled' && itemEditorPayload.initialItem ? 'Edit item' : 'Create item'}
                        </p>
                        <BasicButton
                          params={{
                            variant: 'text',
                            onClick: closeItemEditor,
                            ariaLabel: 'Close item form',
                          }}
                        >
                          Back
                        </BasicButton>
                      </div>

                      <div className=" w-full h-full min-h-0 overflow-y-auto">
                        <ItemFormProvider payload={itemEditorPayload} closeItemForm={closeItemEditor}>
                          <ItemFormLayout />
                        </ItemFormProvider>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="items-preview"
                    initial={{ x: -24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex min-h-0 flex-1 flex-col  bg-[var(--color-muted)]/10 "
                  >
                    {isLoadingInitialItems ? (
                      <div className="text-xs text-[var(--color-muted)]">Loading items...</div>
                    ) : (
                      <ItemsOrderPreview
                        controlled={true}
                        items={visibleItemDrafts}
                        onAddItem={openItemCreateForm}
                        onEditItem={openItemEditForm}
                        stickyHeader
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
