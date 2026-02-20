import { PlanFormLayout } from './PlanForm.layout'
import { PlanFormProvider } from './PlanForm.provider'



export const PlanForm = ({}) => {
    
    return ( 
        <PlanFormProvider >
            <PlanFormLayout/>
        </PlanFormProvider>
    );
}