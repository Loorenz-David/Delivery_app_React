import { planIconTypeMap } from "@/featuresV2/plan/utils/planIconTypeMap"
import { SectionHeader } from "@/shared/section-panel/SectionHeader"
import type { useLocalDeliveryHeaderAction } from "../../hooks/useLocalDeliveryHeaderAction"
import type { DeliveryPlan } from "@/featuresV2/plan/types/plan"
import { BasicButton } from "@/shared/buttons"
import { EditIcon, PdfIcon, PlusIcon, StatsIcon } from "@/assets/icons"
import { RouteOptimizationDropdownButton } from "../RouteOptimizationDropdownButton"
import type { LocalDeliveryPlan } from "../../types/localDeliveryPlan"
import { ThreeDotMenu } from "@/shared/buttons/ThreeDotMenu"


type HeaderProps = {
    localDeliveryActions: ReturnType<typeof useLocalDeliveryHeaderAction>
    plan:DeliveryPlan | null
    localDeliveryPlan:LocalDeliveryPlan | null
}

export const MainHeaderLocalDeliveryPage = ({localDeliveryActions, plan, localDeliveryPlan}:HeaderProps)=>{

    const PlanTypeIcon = planIconTypeMap.local_delivery
    const title = plan?.label ?? 'undefined plan'
    return (
        <>
            <SectionHeader
                title={title}
                icon={<PlanTypeIcon className="h-6 w-6 text-[var(--color-muted)]" />}
                closeButton
            />
            <div className="flex flex-col gap-4 w-full px-5 py-3  "
            key="heade-local-delivery-button"
            >
                    <div className="flex gap-4  w-full">
                         <BasicButton
                            params={{ variant: 'primary', onClick: localDeliveryActions.handleCreateOrder, ariaLabel: 'Create Delivery order' }}
                        >
                            <PlusIcon className="w-4 h-4 mr-2 stroke-[var(--color-secondary)]" />
                            Order
                        </BasicButton>
                        <BasicButton
                            params={{ variant: 'secondary', onClick: localDeliveryActions.handleEditLocalPlan, ariaLabel: 'Edit local delivery plan' }}
                        >
                            <EditIcon className="w-4 h-4 mr-2 stroke-[var(--color-secondary)]" />
                            Edit
                        </BasicButton>
                        <BasicButton
                            params={{ variant: 'secondary', onClick: localDeliveryActions.handleOpenRouteStats, ariaLabel: 'display stats of route solution' }}
                        >
                            <StatsIcon className="w-4 h-4 mr-2 stroke-[var(--color-secondary)]" />
                            Stats
                        </BasicButton>
                       
                        <ThreeDotMenu 
                            dotWidth={3}
                            dotHeight={3}
                            dotClassName={'bg-[var(--color-muted)]'}
                            triggerClassName={' p-2 w-5 rounded-full bg-[var(--color-page)] border border-[var(--color-border)] shadow-sm ml-auto  cursor-pointer'}
                            options={[
                                {label:'Print route', action: localDeliveryActions.handlePrintRouteSolution, icon:<PdfIcon className="h-6 w-6"/>},
                                // {label:'Send messages', action: ()=>{}}
                            ]}
                        />
                        
                    </div>
                    <div className="flex flex-1">
                        <RouteOptimizationDropdownButton
                        localDeliveryPlanId={localDeliveryPlan?.id}
                        planId={plan?.id}
                        borderColor="var(--color-blue-300)"
                        className="w-full"
                        />
                    </div>
                </div>
        </>
    )
}