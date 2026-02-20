
import { InputField } from "@/components/forms/InputField"
import type { InitialFormState, IntegrationConfigSetters } from "../IntegrationConfig.types"
import { Field } from "@/components/forms/FieldContainer"



type IntegrationFormProps = {
  formSetters : IntegrationConfigSetters['shopify'],
  formState : InitialFormState['shopify']
}

export const ShopifyIntegrationForm = ({
    formSetters,
    formState 
}: IntegrationFormProps) => {
    formSetters
    formState 

    return ( 
        <div className="flex flex-col">
            <Field label="Shop name:">
                <InputField
                    value={formState.shop ?? ''}
                    onChange={(e)=>{formSetters.handleShopInput(e.target.value)}}
                />
            </Field>
        </div>
    );
}