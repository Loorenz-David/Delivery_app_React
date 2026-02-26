import type { OrderCase } from "../types";
import { CaseRegistry } from "./orderCase.model";

export const orderCasesCount = (cases: OrderCase[])=>{

    const caseCountMap = {
         order_cases:{
            total: 0
        },
        open_cases:{
            total: 0
        },
        resolving_cases:{
            total: 0
        }
    }

    cases.forEach(orderCase => {
        caseCountMap.order_cases.total += 1
        if (orderCase.state === CaseRegistry.Open) {
            caseCountMap.open_cases.total += 1
        }

        if (orderCase.state === CaseRegistry.Resolving) {
            caseCountMap.resolving_cases.total += 1
        }
    })

    return caseCountMap
}