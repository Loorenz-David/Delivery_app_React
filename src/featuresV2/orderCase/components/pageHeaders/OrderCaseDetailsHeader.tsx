import { MessageIcon } from '@/assets/icons'
import { SectionHeader } from '@/shared/section-panel/SectionHeader'

import { OrderCaseStateSelector } from '../OrderCaseStateSelector'
import type { OrderCaseState } from '../../types'

type OrderCaseDetailsHeaderProps = {
  title: string
  state: OrderCaseState
  onChangeState: (nextState: OrderCaseState) => void
}

export const OrderCaseDetailsHeader = ({
  title,
  state,
  onChangeState,
}: OrderCaseDetailsHeaderProps) => {
  return (
    <>
      <SectionHeader
        title={title}
        icon={<MessageIcon className="h-6 w-6 fill-[var(--color-muted)]" />}
        closeButton
      />

      <div className=" p-3">
        <OrderCaseStateSelector
          value={state}
          onSelect={onChangeState}
        />
      </div>
    </>
  )
}
