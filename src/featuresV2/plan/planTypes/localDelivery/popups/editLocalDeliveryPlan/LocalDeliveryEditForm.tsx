import { LocalDeliveryEditFormLayout } from './LocalDeliveryEditForm.layout'
import { LocalDeliveryEditFormProvider } from './LocalDeliveryEditForm.provider'

export const LocalDeliveryEditForm = ({}) => {
  return (
    <LocalDeliveryEditFormProvider>
      <LocalDeliveryEditFormLayout />
    </LocalDeliveryEditFormProvider>
  )
}
