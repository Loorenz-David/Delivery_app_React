import type { InternationalShippingWarnings } from './InternationalShipping.warnings'


type PropsValidation = {
    internationalShippingWarnings: InternationalShippingWarnings
}

export const internationalShippingValidation = ({
    internationalShippingWarnings,
}: PropsValidation) => {
    internationalShippingWarnings
    const validators = [
        false
    ]

    return validators.every( v => v === false)
}
 
