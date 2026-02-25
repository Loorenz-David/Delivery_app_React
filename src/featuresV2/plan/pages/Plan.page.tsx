
import { useEffect } from "react";



import { usePlanQueries } from "../flows/planQueries.flow";
import { usePlans } from "../store/usePlan.selector";

import { PlanList, PlanMainHeader } from "../components";
import { usePlanHeaderAction } from "../actions/usePlanActions";


type PlanListPage = {
  onRequestClose?: () => void
  showCloseButton?: boolean
}

export const PlanPage = ({
    onRequestClose,
    showCloseButton
}:PlanListPage) => {

    const { fetchPlans }  = usePlanQueries();
    const plans = usePlans()
    const planActions = usePlanHeaderAction()
    useEffect(()=>{
        fetchPlans()
    }, [fetchPlans])


    return ( 
        <div className="flex flex-col w-full h-full">
            <PlanMainHeader
            onCreate={planActions.onCreatePlan}
            onRequestClose={onRequestClose}
            showCloseButton={showCloseButton}
            applySearch={() => {}}
            applyFilters={() => {}}
        />
            <div className="w-full h-full flex flex-col overflow-y-auto">
                <PlanList plans={plans} droppable={true}/>
            </div>
        </div>
     );
}


 
