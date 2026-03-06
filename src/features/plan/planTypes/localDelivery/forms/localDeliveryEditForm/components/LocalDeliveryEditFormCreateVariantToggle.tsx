import { Switch } from '@/shared/inputs/Switch'

import { useLocalDeliveryEditForm } from '../LocalDeliveryEditForm.context'

export const LocalDeliveryEditFormCreateVariantToggle = () => {
  const { formState, formSetters } = useLocalDeliveryEditForm()

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white/80 p-4">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Create variant on save</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Save changes as a new variant instead of overwriting the current one.
        </p>
      </div>
      <Switch
        value={formState.create_variant_on_save}
        onChange={formSetters.handleCreateVariantToggle}
        ariaLabel="Create variant on save"
      />
    </div>
  )
}
