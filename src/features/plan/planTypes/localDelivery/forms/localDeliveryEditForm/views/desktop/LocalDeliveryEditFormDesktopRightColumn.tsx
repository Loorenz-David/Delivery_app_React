import {
  LocalDeliveryEditFormCreateVariantToggle,
  LocalDeliveryEditFormDriverField,
  LocalDeliveryEditFormPlanLabelField,
  LocalDeliveryEditFormStopsServiceTimeField,
} from '../../components'

export const LocalDeliveryEditFormDesktopRightColumn = () => {
  return (
    <div className="relative h-full min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-page)]">
      <div className="flex h-full flex-col gap-7 overflow-y-auto overflow-x-hidden px-3 py-4">
        <LocalDeliveryEditFormPlanLabelField />
        <LocalDeliveryEditFormStopsServiceTimeField />
        <LocalDeliveryEditFormDriverField />
        <LocalDeliveryEditFormCreateVariantToggle />
      </div>
    </div>
  )
}
