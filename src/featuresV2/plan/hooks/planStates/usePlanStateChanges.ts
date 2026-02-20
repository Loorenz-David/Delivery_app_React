import { selectPlanByClientId, selectPlanByServerId, usePlanStore } from "../../store/plan.slice"
import type {  PlanStates } from "../../types/planState"
import { usePlanStateRegistry } from "./usePlanStateRegistry"

export const usePlanStateChanges = ()=>{
    const planStateRegistry = usePlanStateRegistry()


    const changePlanState = (planIdentity:string | number , state:PlanStates | number) =>{
        const planStore = usePlanStore.getState()
        const plan = typeof planIdentity == 'number'
            ? selectPlanByServerId(planIdentity)(planStore)
            : selectPlanByClientId(planIdentity)(planStore)

        if(!plan){
            throw new Error('No plan found with plan identity: ' + planIdentity)
        }

        const currentPlanState = plan.state_id  ?? 1

        const nextState = typeof state == 'number'
            ? planStateRegistry.getById(state)
            : planStateRegistry.getByName(state)

        if(!nextState || !nextState.id ) {
            throw new Error('No state found or state is missing server id with the state name: ' + state)
        }
        planStore.patch(plan.client_id, {state_id:nextState.id})

        return [plan.client_id, currentPlanState]
    }

    return {
        changePlanState
    }
}