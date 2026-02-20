import { useInputWarning } from '@/shared/inputs/useInputWarning.hook'
import { validateString } from '@/shared/data-validation/stringValidation'
import { validateDateTimeComparison } from '@/shared/data-validation/timeValidation'
import type { DeliveryPlan } from '@/featuresV2/plan/types/plan'

export const useLocalDeliveryWarnings = ( planForm?:DeliveryPlan ) => {
    const driverWarning = useInputWarning(
        'Driver should be picked from the dropdown',
        (value: number | null) => typeof value === 'number'
    )

    const actualTimeWarning = useInputWarning(
        'Start time must be before end time',
        (
            { startTime, endTime }: { startTime: string | null; endTime: string | null },
            setWarningMessage
        ) => {
            const hasStart = validateString(startTime ?? '')
            const hasEnd = validateString(endTime ?? '')
            const startDate = planForm?.start_date 
            const endDate = planForm?.end_date ?? '' 

            if (!hasStart && !hasEnd) return true

            if (validateDateTimeComparison(startDate ?? '', startTime ?? '', endDate ?? '', endTime ?? '')) {
                setWarningMessage('Start time must be before end time')
                return false
            }

            return true
        }
    )

   

    return {
        driverWarning,
        actualTimeWarning,
    }
}

export type LocalDeliveryValidation = ReturnType<typeof useLocalDeliveryWarnings>
