import type { ChangeEventHandler, Ref, TextareaHTMLAttributes } from 'react'

import { fieldContainer, fieldInput, invalidStyles } from '../../constants/classes'
import type { InputWarningController } from './useInputWarning'

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'className'> {
  value: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
  fieldClassName?: string
  inputClassName?: string
  warningController?: InputWarningController
  textareaRef?: Ref<HTMLTextAreaElement>
}

export function TextAreaField({
  value,
  onChange,
  fieldClassName = fieldContainer,
  inputClassName = `${fieldInput} min-h-[160px]`,
  warningController,
  textareaRef,
  ...rest
}: TextAreaFieldProps) {
  const isInvalid = Boolean(warningController?.warning.isVisible)
  const containerClasses = [fieldClassName, isInvalid ? invalidStyles : null].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <textarea
        {...rest}
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          warningController?.hideWarning()
          onChange(event)
        }}
        className={inputClassName}
      />
    </div>
  )
}
