import { useState } from 'react'
import { motion } from 'framer-motion'

import type { OrderFormLayoutModel } from '../OrderForm.layout.model'
import { OrderFormCustomerPanel } from './OrderFormCustomerPanel'
import { OrderFormItemsPanel } from './OrderFormItemsPanel'
import { useOrderForm } from '../OrderForm.context'

type OrderFormDesktopRightColumnProps = {
  model: OrderFormLayoutModel
}

export const OrderFormDesktopRightColumn = ({ model }: OrderFormDesktopRightColumnProps) => {
  const [isItemsHovered, setIsItemsHovered] = useState(false)
  const {meta, setSelectedCostumer} = useOrderForm()

  const shouldCollapseCustomer = Boolean(meta.selectedCostumer) && isItemsHovered

  return (
    <div className="flex min-w-[300px] max-w-[350px] min-h-0 flex-1 flex-col gap-4">
      <motion.div
        className="min-h-0 shrink-0"
        animate={{ height: shouldCollapseCustomer ? 100 : 'auto' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <OrderFormCustomerPanel
          costumer={meta.selectedCostumer}
          isCollapsed={shouldCollapseCustomer}
          onSelectCostumer={setSelectedCostumer}
        />
      </motion.div>

      <div className="min-h-0 flex-1" onMouseEnter={() => setIsItemsHovered(true)} onMouseLeave={() => setIsItemsHovered(false)}>
        <OrderFormItemsPanel
          model={model}
          onHoverStart={() => setIsItemsHovered(true)}
          onHoverEnd={() => setIsItemsHovered(false)}
        />
      </div>
    </div>
  )
}
