import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { InputWarning } from '@/shared/inputs/InputWarning'
import { CustomDateTimePicker } from '@/shared/inputs/CustomDateTimePicker'
import { Switch } from '@/shared/inputs/Switch'
import SegmentedSelect from '@/shared/inputs/SegmentedSelect'
import { PopupFooter } from '@/shared/popups/MainPopup/PopupFooter'
import { toDateOnly } from '@/shared/data-validation/timeValidation'

import { AddressAutocomplete } from '@/shared/inputs/address-autocomplete/AddressAutocomplete'
import { MemberSelector } from '@/features/team/members/components'

import { useLocalDeliveryEditForm } from './LocalDeliveryEditForm.context'


export const LocalDeliveryEditFormLayout = ({}) => {
  const {
    formState,
    formWarnings,
    hasMultipleVariants,
    formSetters,
    actions,
  } = useLocalDeliveryEditForm()

  

  const footerConfig = useMemo(() => {
    const config = {
      saveButton: { label: 'Save', action: actions.handleSave },
    }
    if (hasMultipleVariants) {
      return {
        ...config,
        deleteButton: { label: 'Delete', action: actions.handleDelete },
      }
    }
    return config
  }, [actions, hasMultipleVariants])

  const startDate = formState.delivery_plan.start_date
    ? new Date(toDateOnly(formState.delivery_plan.start_date))
    : null
  const endDate = formState.delivery_plan.end_date
    ? new Date(toDateOnly(formState.delivery_plan.end_date))
    : null

  return (
    <div className="relative w-full h-full">
      <motion.form
        layout
        className="flex h-full flex-col gap-7 overflow-y-auto overflow-x-hidden pb-30 scroll-thin px-2"
      >
        
        <Field label="Plan label:">
          <InputField value={formState.delivery_plan.label} onChange={formSetters.handlePlanLabel} />
        </Field>

        <SectionGroup label="Start">
          <Field label="">
            <AddressAutocomplete
              onSelectedAddress={formSetters.handleRouteStartLocation}
              selectedAddress={formState.route_solution.start_location}
            />
          </Field>
          <Field label="">
            <CustomDateTimePicker
              date={startDate}
              onChangeDate={formSetters.handlePlanStartDate}
              selectedTime={formState.route_solution.set_start_time}
              onChangeTime={formSetters.handleRouteStartTime}
            />
          </Field>
          {formWarnings.planDateWarning.warning && (
            <InputWarning {...formWarnings.planDateWarning.warning} />
          )}
        </SectionGroup>
       
        <SectionGroup label="End">
           <Field label="">
            <SegmentedSelect
              options={[
                { label: 'Round trip', value: 'round_trip' },
                { label: 'Custom address', value: 'custom_end_address' },
                { label: 'End at last stop', value: 'end_at_last_stop' },
              ]}
              selectedValue={formState.route_solution.route_end_strategy}
              onSelect={formSetters.handleRouteEndStrategy}
              styleConfig={{textSize:'12px', containerBg:'#eaeaea'}}
            />
          </Field>
          <AnimatePresence initial={false} >
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
            />
          </Field>
          {formWarnings.routeTimeWarning.warning && (
            <InputWarning {...formWarnings.routeTimeWarning.warning} />
          )}
        </SectionGroup>
       

        <Field label="Driver:">
          <MemberSelector
            selectedMember={formState.route_solution.driver_id}
            onSelectMember={formSetters.handleDriverSelection}
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white/80 p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Create variant on save</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Save changes as a new variant instead of overwriting the current one.
            </p>
          </div>
          <Switch
            value={formState.create_variant_on_save}
            onChange={formSetters.handleCreateVariantToggle}
            ariaLabel="Create variant on save"
          />
        </div>
      </motion.form>
      <PopupFooter footerConfig={footerConfig} />
    </div>
  )
}

const SectionGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs  font-semibold text-[var(--color-muted)]">
      {label}
    </span>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
)
