import { PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { AccordionSection } from '@/shared/layout/AccordionSection'
import { CustomDateTimePicker } from '@/shared/inputs/CustomDateTimePicker'
import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { InputWarning } from '@/shared/inputs/InputWarning'
import { OptionPopoverSelect } from '@/shared/inputs/OptionPopoverSelect'
import { PhoneField } from '@/shared/inputs/PhoneField'
import { AddressAutocomplete } from '@/shared/inputs/address-autocomplete/AddressAutocomplete'

import {
  ORDER_PLAN_OBJECTIVE_OPTIONS,
  toDateValue,
  type OrderFormLayoutModel,
} from './OrderForm.layout.model'

type OrderFormFieldsProps = {
  model: OrderFormLayoutModel
  compact?: boolean
}

export const OrderFormFields = ({ model, compact = false }: OrderFormFieldsProps) => {
  const {
    formState,
    warnings,
    formSetters,
    openSection,
    showSecondaryPhone,
    handleSectionToggle,
    handleShowSecondaryPhone,
    handleHideSecondaryPhone,
  } = model

  return (
    <form
      className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 pt-5 scroll-thin ${
        compact ? 'pb-5' : 'h-full pb-[100px]'
      }`}
    >
      <AccordionSection
        title="Details"
        isOpen={openSection === 'details'}
        onToggle={() => handleSectionToggle('details')}
      >
        <Field label="Reference number:" required={true} warningController={warnings.referenceWarning}>
          <InputField
            value={formState.reference_number}
            onChange={formSetters.handleReference}
            warningController={warnings.referenceWarning}
          />
        </Field>
        <Field label="External source:">
          <InputField value={formState.external_source} onChange={formSetters.handleExternalSource} />
        </Field>

        <Field label="Tracking number:">
          <InputField value={formState.tracking_number} onChange={formSetters.handleTrackingNumber} />
        </Field>

        <Field label="Tracking link:">
          <InputField value={formState.tracking_link} onChange={formSetters.handleTrackingLink} />
        </Field>

        {formState.delivery_plan_id == null ? (
          <Field label="Order plan objective:">
            <OptionPopoverSelect
              options={ORDER_PLAN_OBJECTIVE_OPTIONS}
              value={formState.order_plan_objective}
              onChange={formSetters.handleOrderPlanObjective}
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
          <Field
            label="Client first name:"
            required={true}
            warningController={warnings.firstNameWarning}
          >
            <InputField
              value={formState.client_first_name}
              onChange={formSetters.handleFirstName}
              warningController={warnings.firstNameWarning}
            />
          </Field>

          <Field
            label="Client last name:"
            required={true}
            warningController={warnings.lastNameWarning}
          >
            <InputField
              value={formState.client_last_name}
              onChange={formSetters.handleLastName}
              warningController={warnings.lastNameWarning}
            />
          </Field>
        </div>

        <Field label="Client email:" required={true} warningController={warnings.emailWarning}>
          <InputField
            value={formState.client_email}
            onChange={formSetters.handleEmail}
            warningController={warnings.emailWarning}
          />
        </Field>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label="Client primary phone:"
              required={true}
              warning={warnings.primaryPhoneWarning.warning}
            >
              <PhoneField
                phoneNumber={formState.client_primary_phone}
                onChange={formSetters.handlePrimaryPhone}
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
                <PlusIcon className="app-icon h-4 w-4" />
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
                  onChange={formSetters.handleSecondaryPhone}
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
            onSelectedAddress={formSetters.handleAddress}
            selectedAddress={formState.client_address}
          />
        </Field>
      </AccordionSection>

      <AccordionSection
        title="Date & times"
        isOpen={openSection === 'date_times'}
        onToggle={() => handleSectionToggle('date_times')}
      >
        <Field label="Earliest delivery date & start time:">
          <CustomDateTimePicker
            date={toDateValue(formState.earliest_delivery_date)}
            onChangeDate={formSetters.handleEarliestDate}
            selectedTime={formState.preferred_time_start || null}
            onChangeTime={formSetters.handlePreferredTimeStart}
          />
        </Field>

        <Field label="Latest delivery date & end time:">
          <CustomDateTimePicker
            date={toDateValue(formState.latest_delivery_date)}
            onChangeDate={formSetters.handleLatestDate}
            selectedTime={formState.preferred_time_end || null}
            onChangeTime={formSetters.handlePreferredTimeEnd}
          />
        </Field>

        {warnings.dateRangeWarning.warning.isVisible ? (
          <InputWarning {...warnings.dateRangeWarning.warning} />
        ) : null}
      </AccordionSection>
    </form>
  )
}
