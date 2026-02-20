import { Field } from '@/shared/inputs/FieldContainer'
import { useStorePickupForm } from './StorePickup.hook'

import { AddressAutocomplete } from '@/shared/inputs/address-autocomplete/AddressAutocomplete'
import { MemberSelector } from '@/featuresV2/team/members/components'

export const StorePickupForm = ({}) => {
    const {
        formState,
        handleSupervisorSelection,
        handleAddressSelection,
        storePickupWarnings,
    } = useStorePickupForm()

    return ( 
        <div 
            className="flex flex-col gap-4"

        >
            <div className="rounded-xl border border-[var(--color-border)] bg-white/80 p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Store pickup plan</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Use this plan for in-store pickups. Add the pickup location and the assigned teammate.
                </p>
            </div>
            <Field label="Suppervisor:" warningController={ storePickupWarnings.supervisorWarning }>
                <MemberSelector selectedMember={formState.assigned_user_id } onSelectMember={ handleSupervisorSelection }/>
            </Field>
            <Field label="Pickup location:" warningController={ storePickupWarnings.pickupLocationWarning }>
                <AddressAutocomplete
                onSelectedAddress={ handleAddressSelection }
                selectedAddress={ formState.pickup_location }
                />
            </Field>

        </div>
     );
}
 
