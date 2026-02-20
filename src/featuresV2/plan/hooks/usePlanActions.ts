

import { usePopupManager } from "@/shared/resource-manager/useResourceManager"

export const usePlanHeaderAction = () => {
    const popupManager = usePopupManager()
    
    const onCreatePlan = () => {
        popupManager.open({
            key:"PlanForm",
            payload:{ mode: 'create' }
        })
    };

   
    return {
        onCreatePlan,
    };
}