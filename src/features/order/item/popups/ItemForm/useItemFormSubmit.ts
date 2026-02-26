import type { RefObject } from 'react'
import { useCallback, useMemo } from 'react'

import { useMessageHandler } from '@/shared/message-handler'
import { hasFormChanges } from '@/shared/data-validation/compareChanges'

import { useItemController } from '../../hooks/useItemController'
import type { Item, ItemPopupPayload } from '../../types'

export const useItemFormSubmit = ({
  payload,
  formState,
  validateForm,
  initialFormRef,
  closeItemForm,
}: {
  payload: ItemPopupPayload
  formState: Item
  validateForm: () => boolean
  initialFormRef: RefObject<Item | null>
  closeItemForm: () => void
}) => {
  const { showMessage } = useMessageHandler()
  const { saveAutonomousItem, deleteAutonomousItem } = useItemController()

  const canDelete = useMemo(
    () =>
      payload.mode === 'autonomous'
        ? Boolean(payload.itemId)
        : Boolean(payload.initialItem?.client_id && payload.onDelete),
    [payload],
  )

  const handleSave = useCallback(async () => {
    const isValid = validateForm()
    if (!isValid) {
      showMessage({ status: 400, message: 'Please fix the highlighted fields.' })
      return
    }

    const initialForm = initialFormRef.current
    if (!initialForm) {
      showMessage({ status: 400, message: 'Missing initial form snapshot.' })
      return
    }

    if (payload.mode === 'controlled') {
      payload.onSubmit({
        ...formState,
        order_id: payload.orderId,
      })
      closeItemForm()
      return
    }

    if (payload.itemId && !hasFormChanges(formState, initialFormRef)) {
      showMessage({ status: 400, message: 'No changes to save.' })
      return
    }

    const saved = await saveAutonomousItem({
      orderId: payload.orderId,
      itemId: payload.itemId,
      draft: {
        ...formState,
        order_id: payload.orderId,
      },
    })

    if (saved) {
      closeItemForm()
    }
  }, [closeItemForm, formState, initialFormRef, payload, saveAutonomousItem, showMessage, validateForm])

  const handleDelete = useCallback(async () => {
    if (!canDelete) return

    if (payload.mode === 'controlled') {
      const targetId = payload.initialItem?.client_id
      if (!targetId || !payload.onDelete) return

      payload.onDelete(targetId)
      closeItemForm()
      return
    }

    const targetId = payload.itemId
    if (!targetId) return

    const deleted = await deleteAutonomousItem(targetId)
    if (deleted) {
      closeItemForm()
    }
  }, [canDelete, closeItemForm, deleteAutonomousItem, payload])

  return {
    canDelete,
    handleSave,
    handleDelete,
  }
}
