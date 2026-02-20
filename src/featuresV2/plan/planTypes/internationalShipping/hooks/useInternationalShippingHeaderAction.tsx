import { PlusIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { useOrderActions } from '@/featuresV2/order/hooks/useOrderActions'

type Props = {
  planId?: number  | null
}

export const useInternationalShippingHeaderAction = ({
  planId
}: Props) => {
  const { openOrderForm } = useOrderActions()

  const handleCreateOrder = () => {
    openOrderForm({ mode: 'create', deliveryPlanId: planId })
  }

  const headerButtons = [
    <BasicButton
      key="create-plan-button"
      params={{ variant: 'primary', onClick: handleCreateOrder, ariaLabel: 'Create Delivery Plan' }}
    >
      <PlusIcon className="w-4 h-4 mr-2 stroke-[var(--color-secondary)]" />
      Order
    </BasicButton>,
  ]

  return {
    headerButtons,
    handleCreateOrder,
  }
}
