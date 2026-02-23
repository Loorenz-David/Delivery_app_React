import { OrderPage } from "@/featuresV2/order/pages/order.page";
import { PlanPage } from "@/featuresV2/plan/pages/Plan.page";
import { useSelectedPlanOrders } from "@/featuresV2/plan/hooks/useSelectedPlanOrders";
import { useBaseControlls } from "@/shared/resource-manager/useResourceManager";
import { SectionPanel } from "@/shared/section-panel/SectionPanel";
import { SectionManagerHost } from "../components/SectionManagerHost";
import { AnimatePresence, motion } from "framer-motion";

export const HomeMobileView = () => {

    const baseControlls = useBaseControlls()
    const ordersPlanType = baseControlls.payload ? baseControlls.payload?.ordersPlanType ?? null : null
    const SelectedOrdersPlanType = useSelectedPlanOrders(ordersPlanType)
    const windowWidth = window.innerWidth
    return ( 
        <div className="flex flex-1 relative min-w-0 overflow-hidden">
            <SectionPanel style={{width:'100%'}}
                parentParams={{ borderLeft: '#8a8a8a5b' }}
            >
            <PlanPage />
            </SectionPanel>
            
            <AnimatePresence mode="popLayout">
                {
                baseControlls.isBaseOpen 
                ? (
                <motion.div className="absolute inset-0 z-20 h-full w-full min-w-0"
                    layout
                    key={ 'with-order' }
                    initial={{ x: windowWidth}}
                    animate={{ x: 0 }}
                    exit={{ x: windowWidth }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <SectionPanel
                        onRequestClose={ baseControlls.closeBase }
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
                        >
                        {
                        SelectedOrdersPlanType && 
                        <SelectedOrdersPlanType payload={baseControlls.payload} />
                        }
                    </SectionPanel>
                </motion.div>
                ) : null
            }

            </AnimatePresence>

            <SectionManagerHost
                stackKey="dynamicSectionPanels"
                isBaseOpen={baseControlls.isBaseOpen}
                containerClassName="absolute inset-0 z-30 min-w-0"
                width={windowWidth}
            />

            

        </div> 
    );
}
 
