import { motion } from 'framer-motion'

import { LocalDeliveryEditFormCreateVariantToggle } from './LocalDeliveryEditFormCreateVariantToggle'
import { LocalDeliveryEditFormDriverField } from './LocalDeliveryEditFormDriverField'
import { LocalDeliveryEditFormPlanLabelField } from './LocalDeliveryEditFormPlanLabelField'
import { LocalDeliveryEditFormRouteSections } from './LocalDeliveryEditFormRouteSections'

export const LocalDeliveryEditFormFields = ({
  includePlanMeta = true,
}: {
  includePlanMeta?: boolean
}) => {
  return (
    <motion.form
      layout
      className="flex h-full flex-col gap-7 overflow-y-auto overflow-x-hidden pb-30 scroll-thin px-2"
    >
      {includePlanMeta ? <LocalDeliveryEditFormPlanLabelField /> : null}
      <LocalDeliveryEditFormRouteSections />
      {includePlanMeta ? <LocalDeliveryEditFormDriverField /> : null}
      {includePlanMeta ? <LocalDeliveryEditFormCreateVariantToggle /> : null}
    </motion.form>
  )
}
