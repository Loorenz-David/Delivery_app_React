import { formatPhone } from '@/shared/data-validation/phoneValidation'
import { StateCard } from '@/shared/layout/StateCard'
import { useEffect, useState } from 'react'

import type { Order } from '../types/order'
import type { OrderState } from '../types/orderState'
import { AccordionSection } from '@/shared/layout/AccordionSection'
import type { PropsWithChildren } from 'react'
import { formatIsoDate } from '@/shared/utils/formatIsoDate'
import { DateRangeCard } from './cards/DateRangeCard'

type OrderDetailSummaryProps = {
  order: Order | null
}



export const OrderDetailTimeWindows = ({ order }: OrderDetailSummaryProps) => {

  return (
      <div className="border-1 rounded-lg border-[var(--color-muted)]/40  px-4 py-4 min-h-[300px] ">
         <DateRangeCard dateLabel="27 Mar, 2026" from={'19:00'} to={'20:00'} />
      </div>
  )
}


