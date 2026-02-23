import { PlanFormLayout } from './PlanForm.layout'
import { PlanFormProvider } from './PlanForm.provider'



export const PlanFormFeature = ({}) => {
    
    return ( 
        <PlanFormProvider >
            <PlanFormLayout/>
        </PlanFormProvider>
    );
}
