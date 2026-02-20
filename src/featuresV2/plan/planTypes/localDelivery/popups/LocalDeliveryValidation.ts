import type { LocalDeliveryValidation } from './LocalDelivery.warnings'
import type { LocalDeliveryPlan } from '@/featuresV2/plan/planTypes/localDelivery/types/localDeliveryPlan'


type PropsValidation = {
    localDeliveryWarnings: LocalDeliveryValidation
    formState: LocalDeliveryPlan
}

export const localDeliveryValidation = ({
    localDeliveryWarnings,
    formState,
}: PropsValidation) => {
    
    const validators = [
        localDeliveryWarnings.actualTimeWarning.validate({ startTime: formState.actual_start_time, endTime: formState.actual_end_time })
    ]

    return validators.every( v => v === true)
}
 
