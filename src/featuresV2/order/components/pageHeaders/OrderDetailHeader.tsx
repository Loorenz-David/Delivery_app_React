import { ArchiveIcon, DocumentIcon,  EditIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'
import type { Order } from '../../types/order'
import { DropdownButton } from '@/shared/buttons/DropdownButton'
import { OrderStateList } from '../OrderStateList'
import { useOrderStateRegistry } from '../../domain/useOrderStateRegistry'
import { useOrderStateController } from '../../controllers/orderState.controller'
import { CounterBadge } from '@/shared/layout/CounterBadge'

type OrderDetailHeaderProps = {
    openOrderForm:(payload:{ clientId?: string; mode?: 'create' | 'edit'; deliveryPlanId?: number | null })=> void
    openOrderCases:(payload:{ orderId?: number, orderReference:string })=> void
    order: Order | null
}

export const OrderDetailHeader = ({ 
  openOrderForm,
  openOrderCases,

  order 
}: OrderDetailHeaderProps) => {
    const registry = useOrderStateRegistry()
    const { advanceOrderState } = useOrderStateController()

    const currentStateName = order?.order_state_id != null
      ? (registry.getById(order.order_state_id)?.name ?? 'Unknown state')
      : 'Unknown state'



    return (
        <>
        <SectionHeader
            title={<HeaderTitle order={order}/>}
            icon={<DocumentIcon className="h-6 w-6 text-[var(--color-muted)]" />}
            closeButton={true}
            actions={undefined}
            headerButtonsBgClass="bg-[var(--color-primary)]/5"
        />
        <div className="flex gap-4 p-4 justify-between">
          <div className="flex w-[120px]">
            <DropdownButton
                label={currentStateName}
                variant="primary"
                fullWidth={true}
                disabled={!order}
                onClick={() => {
                  if (!order) return
                  void advanceOrderState(order.client_id)
                }}
            >
              {order ? (
                <OrderStateList order={order} />
              ) : (
                <div className="px-2 py-2 text-sm text-[var(--color-muted)]">
                  Order not available.
                </div>
              )}
            </DropdownButton>
          </div>  
          <div className="flex gap-3">
              <BasicButton
                  key="order-cases"
                  params={{
                      variant: 'secondary',
                      onClick: () => order?.id && openOrderCases({ orderId: order.id, orderReference: order.reference_number ?? '' }),
                      ariaLabel: 'Edit order',
                  }}
                  >
                  <ArchiveIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
                  <div className="flex gap-3">
                    <span>
                      Cases
                    </span>
                    { Boolean(order?.open_order_cases  && order.open_order_cases > 0 ) && 
                      <CounterBadge 
                        text={String(order?.open_order_cases) }
                        bgColor="rgb(255, 213, 3)"
                        textColor="rgb(63, 84, 0)"
                      />
                    }
                  </div>
              </BasicButton>
                
              <BasicButton
                  key="order-detail-edit"
                  params={{
                      variant: 'secondary',
                      onClick: () => order && openOrderForm({ mode: 'edit', clientId: order.client_id }),
                      ariaLabel: 'Edit order',
                  }}
                  >
                  <EditIcon className="mr-2 h-4 w-4 stroke-[var(--color-secondary)]" />
                  Edit
              </BasicButton>

          </div>
        </div>
        </>

    )
}


const HeaderTitle = ({order}:{order:Order | null})=>{
  const title = order?.reference_number ?? 'reference number missing'
  return (
    <div className="flex flex-col gap-[5px]">
        <span className="text-md font-semibold text-[var(--color-muted)]/80">
          {title}
        </span>
        {order?.external_source && 
          <span className="inline-flex w-fit rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[0.5rem] uppercase tracking-wide text-[var(--color-muted)]">
            {order.external_source}
          </span>
        }
    </div>
  )
}