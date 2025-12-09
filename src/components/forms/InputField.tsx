import type { ChangeEventHandler, InputHTMLAttributes } from 'react'

import { fieldContainer, fieldInput, invalidStyles } from '../../constants/classes'
import type { InputWarningController } from './useInputWarning'

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'className'> {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  type?: string
  fieldClassName?: string
  inputClassName?: string
  warningController?: InputWarningController
}



export function InputField({
  value,
  onChange,
  type = 'text',
  fieldClassName = fieldContainer,
  inputClassName = fieldInput,
  warningController,
  ...rest
}: InputFieldProps) {
  const isInvalid = Boolean(warningController?.warning.isVisible)
  const containerClasses = [fieldClassName, isInvalid ? invalidStyles : null].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <input
        {...rest}
        value={value}
        onChange={(event) => {
          warningController?.hideWarning()
          onChange(event)
        }}
        type={type}
        className={inputClassName}
      />
    </div>
  )
}
