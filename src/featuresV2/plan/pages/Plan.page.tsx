
import { useEffect } from "react";



import { usePlanQueries } from "../flows/planQueries.flow";
import { usePlans } from "../store/usePlan.selector";

import { PlanList, PlanMainHeader } from "../components";
import { usePlanHeaderAction } from "../actions/usePlanActions";


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
 
