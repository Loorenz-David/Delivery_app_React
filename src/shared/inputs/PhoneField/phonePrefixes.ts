import { phonePrefixOptions } from '@/constants/dropDownOptions'

export type PhonePrefixOption = {
  value: string
  display: string
  countryName: string
}

export const phonePrefixes: PhonePrefixOption[] = phonePrefixOptions
