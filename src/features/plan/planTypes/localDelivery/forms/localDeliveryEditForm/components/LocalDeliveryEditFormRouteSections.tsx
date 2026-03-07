import { AnimatePresence, motion } from 'framer-motion'

import { AddressAutocomplete } from '@/shared/inputs/address-autocomplete/AddressAutocomplete'
import { CustomDateTimePicker } from '@/shared/inputs/CustomDateTimePicker'
import { Field } from '@/shared/inputs/FieldContainer'
import { InputWarning } from '@/shared/inputs/InputWarning'
import SegmentedSelect from '@/shared/inputs/SegmentedSelect'
import { toDateOnly } from '@/shared/data-validation/timeValidation'

import { useLocalDeliveryEditForm } from '../LocalDeliveryEditForm.context'
import { LocalDeliveryEditFormSectionGroup } from './LocalDeliveryEditFormSectionGroup'

export const LocalDeliveryEditFormRouteSections = () => {
  const {
    formState,
    formWarnings,
    formSetters,
  } = useLocalDeliveryEditForm()

  const startDate = formState.delivery_plan.start_date
    ? new Date(toDateOnly(formState.delivery_plan.start_date))
    : null
  const endDate = formState.delivery_plan.end_date
    ? new Date(toDateOnly(formState.delivery_plan.end_date))
    : null

  return (
    <>
      <LocalDeliveryEditFormSectionGroup label="Start">
        <Field label="">
          <AddressAutocomplete
            onSelectedAddress={formSetters.handleRouteStartLocation}
            selectedAddress={formState.route_solution.start_location}
            inputClassName={'text-sm w-full'}
            placeholder="search for start address..."
            intentKey={'local-delivery-start-address'}
            enableSavedLocations
            enableCurrentLocation
            defaultToCurrentLocation
          />
        </Field>
        <Field label="">
          <CustomDateTimePicker
            date={startDate}
            onChangeDate={formSetters.handlePlanStartDate}
            selectedTime={formState.route_solution.set_start_time}
            onChangeTime={formSetters.handleRouteStartTime}
            datePickerClassName={"py-3 ml-3"}
            timePickerClassName={"py-3"}
          />
        </Field>
        {formWarnings.planDateWarning.warning && (
          <InputWarning {...formWarnings.planDateWarning.warning} />
        )}
      </LocalDeliveryEditFormSectionGroup>

      <LocalDeliveryEditFormSectionGroup label="End">
        <Field label="">
          <SegmentedSelect
            options={[
              { label: 'Round trip', value: 'round_trip' },
              { label: 'Custom address', value: 'custom_end_address' },
              { label: 'End at last stop', value: 'end_at_last_stop' },
            ]}
            selectedValue={formState.route_solution.route_end_strategy}
            onSelect={formSetters.handleRouteEndStrategy}
            styleConfig={{ textSize: '12px', containerBg: '#eaeaea' }}
          />
        </Field>
        <AnimatePresence initial={false}>
          {formState.route_solution.route_end_strategy == 'custom_end_address' && (
            <motion.div
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Field label="">
                <AddressAutocomplete
                  onSelectedAddress={formSetters.handleRouteEndLocation}
                  selectedAddress={formState.route_solution.end_location}
                  inputClassName={'text-sm w-full'}
                  placeholder="search for end address..."
                  intentKey={'local-delivery-end-address'}
                  enableSavedLocations
                  enableCurrentLocation
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <Field label="">
          <CustomDateTimePicker
            date={endDate}
            onChangeDate={formSetters.handlePlanEndDate}
            selectedTime={formState.route_solution.set_end_time}
            onChangeTime={formSetters.handleRouteEndTime}
            datePickerClassName={"py-3 ml-3"}
            timePickerClassName={"py-3"}
          />
        </Field>
        {formWarnings.routeTimeWarning.warning && (
          <InputWarning {...formWarnings.routeTimeWarning.warning} />
        )}
      </LocalDeliveryEditFormSectionGroup>
    </>
  )
}
