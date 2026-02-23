import { LocalDeliveryEditFormFeature } from '@/featuresV2/plan/planTypes/localDelivery/forms/localDeliveryEditForm/LocalDeliveryEditForm'
import { useLocalDeliveryEditFormPopupConfig } from './LocalDeliveryEditFormPopupConfig.hook'

export const LocalDeliveryEditForm = () => {
  useLocalDeliveryEditFormPopupConfig()

  return <LocalDeliveryEditFormFeature />
}
