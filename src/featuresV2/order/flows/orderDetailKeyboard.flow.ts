import { useEffect } from 'react'

type UseOrderDetailKeyboardFlowParams = {
  isEnabled: boolean
  clientId: string | null
  orderId: number | undefined
  orderReference: string
  isPopupOpen: () => boolean
  isCaseOpen: () => boolean
  onEdit: (clientId: string) => void
  onOpenCases: (payload: { orderId?: number; orderReference: string }) => void
}

export const useOrderDetailKeyboardFlow = ({
  isEnabled,
  clientId,
  orderId,
  orderReference,
  isPopupOpen,
  isCaseOpen,
  onEdit,
  onOpenCases,
}: UseOrderDetailKeyboardFlowParams) => {
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'e' && clientId) {
        if (isPopupOpen()) return
        onEdit(clientId)
      }

      if (event.key === 'c' && clientId) {
        if (isPopupOpen()) return
        if (isCaseOpen()) return
        onOpenCases({ orderId, orderReference })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [clientId, isCaseOpen, isEnabled, isPopupOpen, onEdit, onOpenCases, orderId, orderReference])
}
