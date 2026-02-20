import { useEffect, useRef } from 'react'


import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderCaseChatComposer } from '../../components/OrderCaseChatComposer'
import { OrderCaseChatList } from '../../components/OrderCaseChatList'
import { OrderCaseDetailsHeader } from '../../components/pageHeaders/OrderCaseDetailsHeader'
import { CaseDetailsPageProvider } from '../../context/details/caseDetails.provider'



import { useCaseDetailsContext } from '../../context/details/caseDetails.context'

type OrderCaseDetailsPayload = {
  orderCaseClientId: string

}

const CaseDetailsPageContent = () => {
  const { orderCase, detailsActions, currentUserId } = useCaseDetailsContext()

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [orderCase?.chats.length])

  if (!orderCase) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-4 text-sm text-[var(--color-muted)]">
        Case not found.
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-page)]">
      <OrderCaseDetailsHeader
        title={orderCase.label?.trim() ? orderCase.label : `Case #${orderCase.id}`}
        state={orderCase.state}
        onChangeState={detailsActions.changeState}
      />

      <div className="flex-1 overflow-y-auto p-3">
        <OrderCaseChatList
          chats={orderCase.chats}
          currentUserId={currentUserId}
        />
        <div ref={bottomRef} />
      </div>

      <div className="p-3 pb-5">
        <OrderCaseChatComposer
          value={detailsActions.message}
          onChange={detailsActions.setMessage}
          onSend={detailsActions.addChat}
          disabled={!detailsActions.message.trim()}
        />
      </div>
    </div>
  )
}

export const CaseDetailsPage = ({ payload }: StackComponentProps<OrderCaseDetailsPayload>) => {
  const orderCaseClientId = payload?.orderCaseClientId


  if (!orderCaseClientId) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-4 text-sm text-[var(--color-muted)]">
        Missing case id.
      </div>
    )
  }

  return (
    <CaseDetailsPageProvider orderCaseClientId={orderCaseClientId}>
      <CaseDetailsPageContent/>
    </CaseDetailsPageProvider>
  )
}
