import { PhoneFieldLayout } from './PhoneField.layout'
import { PhoneFieldProvider } from './PhoneField.provider'
import type { PhoneFieldProps } from './PhoneField.types'

export const PhoneField = ({ phoneNumber, onChange }: PhoneFieldProps) => {
  return (
    <PhoneFieldProvider phoneNumber={phoneNumber} onChange={onChange}>
      <PhoneFieldLayout />
    </PhoneFieldProvider>
  )
}
