import { useInputWarning } from '@/shared/inputs/useInputWarning.hook'
import { validateString } from '@/shared/data-validation/stringValidation'
import { validateDateComparison, validateDateTimeComparison } from '@/shared/data-validation/timeValidation'

type PlanDatePayload = { start_date: string; end_date: string }

type RouteTimePayload = {
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
}

export const useLocalDeliveryEditFormWarnings = () => {
  const planDateWarning = useInputWarning(
    'Plan must have a start and end date',
    ({ start_date, end_date }: PlanDatePayload, setWarningMessage) => {
      if (!validateString(start_date)) {
        setWarningMessage('Plan must have a start date')
        return false
      }
      if (!validateString(end_date)) {
        setWarningMessage('Plan must have an end date')
        return false
      }
      if (!validateDateComparison(start_date, end_date)) {
        setWarningMessage("'Start' date must be before 'End' date")
        return false
      }
      return true
    },
  )

  const routeTimeWarning = useInputWarning(
    'End time must be after start time',
    ({ start_date, end_date, start_time, end_time }: RouteTimePayload, setWarningMessage) => {
      const isValid = validateDateTimeComparison(start_date, start_time, end_date, end_time)
      if (!isValid) {
        setWarningMessage('End time must be after start time')
        return false
      }
      return true
    },
  )

  return {
    planDateWarning,
    routeTimeWarning,
  }
}
