import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderCaseList } from '@/featuresV2/orderCase/components/OrderCaseList'
import { OrderCaseOrderCasesHeader } from '@/featuresV2/orderCase/components/pageHeaders/OrderCaseOrderCasesHeader'
import { CaseOrderProvider } from '@/featuresV2/orderCase/context/order/caseOrder.provider'
import { useCaseOrderContext } from '../../context/order/caseOrder.context'

type OrderCaseOrderCasesPayload = {
  orderId: number
  orderReference: string

}

const CaseOrderPageContent = ({ orderId, orderReference }: { orderId: number, orderReference?:string }) => {

  const {caseOrderActions, cases} = useCaseOrderContext()

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-page)]">
      <OrderCaseOrderCasesHeader
        orderReference={orderReference}
        onCreateCase={() => {
          caseOrderActions.createOpenCase(orderId)
        }}
      />

      <div className="flex-1 overflow-y-auto p-3">
        <OrderCaseList
          cases={cases}
          onOpenCase={caseOrderActions.openCaseDetails}
          onDeleteCase={(orderCaseId) => {
            caseOrderActions.removeCase(orderCaseId)
          }}
        />
      </div>
    </div>
  )
}

export const CaseOrderPage = ({ payload }: StackComponentProps<OrderCaseOrderCasesPayload>) => {
  const orderId = payload?.orderId
  const orderReference = payload?.orderReference


  if (!orderId) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-4 text-sm text-[var(--color-muted)]">
        Missing order id.
      </div>
    )
  }

  return (
    <CaseOrderProvider orderId={orderId}>
      <CaseOrderPageContent orderId={orderId} orderReference={orderReference} />
    </CaseOrderProvider>
  )
}
