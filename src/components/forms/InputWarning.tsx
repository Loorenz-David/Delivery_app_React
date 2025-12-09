export interface InputWarningState {
  message?: string
  isVisible: boolean
}

export function InputWarning({ message, isVisible }: InputWarningState) {
  if (!isVisible || !message) {
    return null
  }

  return <span className="text-xs font-medium text-red-600">{message}</span>
}
