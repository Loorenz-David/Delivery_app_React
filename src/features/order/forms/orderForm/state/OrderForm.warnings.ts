import { useInputWarning } from '@/shared/inputs/useInputWarning.hook'
import { validateAddress } from '@/shared/data-validation/addressValidation'
import { validateString } from '@/shared/data-validation/stringValidation'
import { validateDateComparison, validateDateTimeComparison, toDateOnly } from '@/shared/data-validation/timeValidation'
import type { address } from '@/types/address'
import type { Phone } from '@/types/phone'

import { useOrderValidation } from '../../../domain/useOrderValidation'

export const useOrderFormWarnings = () => {
  const validation = useOrderValidation()


  const referenceWarning = useInputWarning('Reference is required.', (value, setMessage) => {
    const isValid = validation.validateReferenceNumber(String(value ?? ''))
    if (!isValid) {
      setMessage('Reference is required.')
    }
    return isValid
  })

  const firstNameWarning = useInputWarning('First name is required.', (value, setMessage) => {
    const isValid = validation.validateCustomerName(String(value ?? ''))
    if (!isValid) {
      setMessage('First name is required.')
    }
    return isValid
  })

  const lastNameWarning = useInputWarning('Last name is required.', (value, setMessage) => {
    const isValid = validation.validateCustomerName(String(value ?? ''))
    if (!isValid) {
      setMessage('Last name is required.')
    }
    return isValid
  })

  const emailWarning = useInputWarning('Valid email is required.', (value, setMessage) => {
    const emailValue = String(value ?? '').trim()
    const isValid = validateString(emailValue) && validation.validateCustomerEmail(emailValue)
    if (!isValid) {
      setMessage('Valid email is required.')
    }
    return isValid
  })

  const primaryPhoneWarning = useInputWarning('Primary phone is required.', (value, setMessage) => {
    const phone = value as Phone | null | undefined
    const isValid = validation.validatePhone(phone, { required: true })
    if (!isValid) {
      setMessage('Primary phone is required.')
    }
    return isValid
  })

  const addressWarning = useInputWarning('Address is required.', (value, setMessage) => {
    const candidate = value as address | null | undefined
    const isValid = validateAddress(candidate ?? null)
    if (!isValid) {
      setMessage('Address is required.')
    }
    return isValid
  })

  const earliestDateWarning = useInputWarning('Earliest delivery date is required.', (value, setMessage) => {
    const isValid = validateString(String(value ?? ''))
    if (!isValid) {
      setMessage('Earliest delivery date is required.')
    }
    return isValid
  })

  const latestDateWarning = useInputWarning('Latest delivery date is required.', (value, setMessage) => {
    const isValid = validateString(String(value ?? ''))
    if (!isValid) {
      setMessage('Latest delivery date is required.')
    }
    return isValid
  })

  const preferredTimeStartWarning = useInputWarning('Start time is required.', (value, setMessage) => {
    const candidate = String(value ?? '')
    const isValid = validation.validateTimeValue(candidate, { required: true })
    if (!isValid) {
      setMessage('Start time is required.')
    }
    return isValid
  })

  const preferredTimeEndWarning = useInputWarning('End time is required.', (value, setMessage) => {
    const candidate = String(value ?? '')
    const isValid = validation.validateTimeValue(candidate, { required: true })
    if (!isValid) {
      setMessage('End time is required.')
    }
    return isValid
  })

  const dateRangeWarning = useInputWarning(
    'Latest date/time cannot be before earliest date/time.',
    (value, setMessage) => {
      const candidate = value as {
        earliest_delivery_date: string | null
        latest_delivery_date: string | null
        preferred_time_start: string
        preferred_time_end: string
      }

      const earliestDateOnly = toDateOnly(candidate.earliest_delivery_date)
      const latestDateOnly = toDateOnly(candidate.latest_delivery_date)

      if (!earliestDateOnly || !latestDateOnly) {
        return true
      }

      const isDateRangeValid = validateDateComparison(earliestDateOnly, latestDateOnly)
      const isDateTimeRangeValid = validateDateTimeComparison(
        candidate.earliest_delivery_date,
        candidate.preferred_time_start || null,
        candidate.latest_delivery_date,
        candidate.preferred_time_end || null,
      )

      const isValid = isDateRangeValid && isDateTimeRangeValid
      if (!isValid) {
        setMessage('Latest date/time cannot be before earliest date/time.')
      }
      return isValid
    },
  )

  return {
    referenceWarning,
    firstNameWarning,
    lastNameWarning,
    emailWarning,
    primaryPhoneWarning,
    addressWarning,
    earliestDateWarning,
    latestDateWarning,
    preferredTimeStartWarning,
    preferredTimeEndWarning,
    dateRangeWarning,
  }
}
