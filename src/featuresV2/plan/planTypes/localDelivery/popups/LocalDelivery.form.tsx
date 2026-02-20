import { Field } from '@/shared/inputs/FieldContainer'

import { useLocalDeliveryForm } from './LocalDelivery.hook'
import { CustomTimePicker } from '@/shared/inputs/CustomTimePicker'
import { MemberSelector } from '@/featuresV2/team/members/components'
import { InputWarning } from '@/shared/inputs/InputWarning'

export const LocalDeliveryForm = ({}) => {
    const { 
        formState,
        handleActualStartTime,
        handleActualEndTime,
        handleDriverSelection,
        localDeliveryWarnings,
    } = useLocalDeliveryForm()

    return ( 
        <div 
            className="flex flex-col gap-4"

        >
            <div className="rounded-xl border border-[var(--color-border)] bg-white/80 p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Local delivery plan</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Use this plan for same-area drops. Assign a driver and track actual start/end times.
                </p>
            </div>

            <Field label="Driver:" warningController={ localDeliveryWarnings.driverWarning }>
                <MemberSelector selectedMember={formState.driver_id } onSelectMember={ handleDriverSelection }/>
            </Field>


            <div className="grid grid-cols-2 gap-6">
                <Field label=" start time:" >
                    <CustomTimePicker
                        selectedTime={ formState.actual_start_time}
                        onChange={ handleActualStartTime }
                    />
                </Field>
                <Field label=" end time:" >
                     <CustomTimePicker
                        selectedTime={ formState.actual_end_time}
                        onChange={ handleActualEndTime }
                    />
                </Field>
            </div>
            { localDeliveryWarnings.actualTimeWarning?.warning && <InputWarning {...localDeliveryWarnings.actualTimeWarning.warning} />}

       

        </div>
     );
}
 
