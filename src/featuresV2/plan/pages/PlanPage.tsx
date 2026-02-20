
import { useEffect } from "react";



import { usePlanQueries } from "../hooks/usePlanQueries";
import { usePlans } from "../hooks/usePlanSelectors";

import { PlanList } from "../components/PlanList";
import { PlanMainHeader } from "../components/headers/PlanMainHeader";
import { usePlanHeaderAction } from "../hooks/usePlanActions";


export const PlanPage = ({}) => {
    const { fetchPlans }  = usePlanQueries();
    const plans = usePlans()


    const planActions = usePlanHeaderAction()
    useEffect(()=>{
        fetchPlans()
    }, [])

    return ( 
        <div className="w-full h-full flex flex-col">
            <PlanMainHeader
                onCreate= {planActions.onCreatePlan} 
                applySearch={() => {}} 
                applyFilters={() => {}} 
            />
            <PlanList plans={plans} droppable={true}/>
        </div>
     );
}
 
