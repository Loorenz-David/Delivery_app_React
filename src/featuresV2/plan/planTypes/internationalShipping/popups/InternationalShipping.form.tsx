import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { useInternationalShippingForm } from './InternationalShipping.hook'

export const InternationalShippingForm = ({}) => {
    const {
        formState,
        handleCarrierName,
    } = useInternationalShippingForm ()

    return ( 
        <div 
            className="flex flex-col gap-4"

        >
            <div className="rounded-xl border border-[var(--color-border)] bg-white/80 p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">International shipping plan</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Use this plan for cross-border shipments. Specify the carrier handling the delivery.
                </p>
            </div>
              
            <Field label="Carrier name:" >
                <InputField
                    value={formState.carrier_name ?? ''}
                    onChange={handleCarrierName}
                />
            </Field>

        </div>
     );
}
 
