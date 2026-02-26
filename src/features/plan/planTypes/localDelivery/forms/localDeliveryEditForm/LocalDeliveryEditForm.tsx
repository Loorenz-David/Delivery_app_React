import { LocalDeliveryEditFormLayout } from './LocalDeliveryEditForm.layout'
import { LocalDeliveryEditFormProvider } from './LocalDeliveryEditForm.provider'

export const LocalDeliveryEditFormFeature = () => {
  return (
    <LocalDeliveryEditFormProvider>
      <LocalDeliveryEditFormLayout />
    </LocalDeliveryEditFormProvider>
  )
}
