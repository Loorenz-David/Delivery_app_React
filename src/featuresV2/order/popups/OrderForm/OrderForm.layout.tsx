import { useCallback, useState } from 'react'
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
import { CloseIcon, SingleOrderIcon } from '@/assets/icons'
import {
  emitExternalFormRequest,
  type ExternalFormReceivedPayload,
} from '@/realtime/externalForm/externalForm.realtime'
import { useExternalFormRealtime } from '@/realtime/externalForm/useExternalFormRealtime'
import { sessionStorage } from '@/featuresV2/auth/login/store/sessionStorage'


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

export const OrderFormLayout = () => {
  const {
    mode,
    formState,
    creationDate,
    warnings,
    setFormState,
    handleSave,
    initialFormRef,
    visibleItemDrafts,
    isLoadingInitialItems,
    openItemCreateForm,
    openItemEditForm,
    isItemEditorOpen,
    itemEditorPayload,
    closeItemEditor,
  } = useOrderForm()

  const [openSection, setOpenSection] = useState<'details' | 'client_information' | 'date_times' | null>(
    null,
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

  const label = mode === 'create' ? 'Create Order' : 'Edit Order'



  return (

    <div className="flex h-full gap-6">
      <div className="flex flex-col relative h-full w-[550px] bg-[var(--color-page)]  rounded-xl">
        <header className={
          `flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4` 
        }
        >
          <div className="flex items-center justify-center rounded-full  bg-[var(--color-muted)]/20 p-3  ">
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
        <form className="flex pt-5  h-full flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 pb-[100px] scroll-thin">
          <AccordionSection
            title="Details"
            isOpen={openSection === 'details'}
            onToggle={() => setOpenSection((prev) => (prev === 'details' ? null : 'details'))}
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
            onToggle={() =>
              setOpenSection((prev) => (prev === 'client_information' ? null : 'client_information'))
            }
          >
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

            <Field label="Client email:" required={true} warningController={warnings.emailWarning}>
              <InputField
                value={formState.client_email}
                onChange={setters.handleEmail}
                warningController={warnings.emailWarning}
              />
            </Field>

            <Field label="Client primary phone:" required={true} warning={warnings.primaryPhoneWarning.warning}>
              <PhoneField
                phoneNumber={formState.client_primary_phone}
                onChange={setters.handlePrimaryPhone}
              />
            </Field>

            <Field label="Client secondary phone:">
              <PhoneField
                phoneNumber={formState.client_secondary_phone}
                onChange={setters.handleSecondaryPhone}
              />
            </Field>

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
            onToggle={() => setOpenSection((prev) => (prev === 'date_times' ? null : 'date_times'))}
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
        <OrderFormFooter
          onSendForm={handleSendForm}
          onSaveOrder={handleSave}
          sendDisabled={employeeUserId <= 0}
        />
      </div>
      <motion.div className="flex   h-full bg-[var(--color-page)] w-[400px] rounded-xl overflow-hidden"
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
            <div className="relative w-full rounded-lg border border-[var(--color-muted)]/20 shadow-sm">
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
                    className="w-full h-full bg-[var(--color-muted)]/10"
                  >
                    {isLoadingInitialItems ? (
                      <div className="text-xs text-[var(--color-muted)]">Loading items...</div>
                    ) : (
                      <ItemsOrderPreview
                        controlled={true}
                        items={visibleItemDrafts}
                        onAddItem={openItemCreateForm}
                        onEditItem={openItemEditForm}
                        scrollBody
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
