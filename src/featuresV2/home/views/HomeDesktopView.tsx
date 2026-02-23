import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { useSectionManager, useMapManager, usePopupManager } from '@/shared/resource-manager/useResourceManager'

import { ArchiveIcon, BellIcon, ChevronDownIcon, SettingIcon } from '@/assets/icons'

import { PlanPage } from '@/featuresV2/plan/pages/Plan.page'
import { OrderPage } from '@/featuresV2/order/pages/order.page'
import { OrderMapOverlay } from '@/featuresV2/order/components/OrderMapOverlay'
import { useBaseControlls } from '@/shared/resource-manager/useResourceManager'
import { planSectionsMap } from '@/featuresV2/plan/'


import { HomeDesktopLayout } from '../layout/HomeDesktopLayout'
import { useHomeDesktopLayout } from '../hooks/useHomeDesktopLayout'
import { SectionManagerHost } from '../components/SectionManagerHost'


import { SectionPanel } from '../../../shared/section-panel/SectionPanel'
import { useMobile } from '@/app/contexts/MobileContext'


export function HomeDesktopView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  const {initialize, resize} = useMapManager()
  const sectionManager = useSectionManager()
  const popupManager = usePopupManager()
  const openSectionsCount = sectionManager.getOpenCount()
  const layout = useHomeDesktopLayout({ openSectionsCount })
  const baseControlls = useBaseControlls()
  const {isMobile} = useMobile()

  const ordersPlanType = baseControlls.payload ? baseControlls.payload?.ordersPlanType ?? null : null
  let SelectedOrdersPlanType = null
  if(ordersPlanType){
    SelectedOrdersPlanType = planSectionsMap[ordersPlanType] 
  }

  useEffect(()=>{
    void initialize(mapContainerRef.current)
  }, [initialize])

  const handleKeyDown = (event:KeyboardEvent)=>{
    const isPopupOpen = popupManager.getOpenCount() > 0 
    
    if(event.key == 'p'){
      if(isPopupOpen) return
      sectionManager.closeAll()
      layout.togglePlan()
    }
  }
  
  useEffect(()=>{

    if(!isMobile){
      window.addEventListener('keydown', handleKeyDown)
    }

      return () => {

          window.removeEventListener('keydown', handleKeyDown)
      }
  },[isMobile,baseControlls.isBaseOpen])
 
  return (
    <>
      <HomeDesktopHeader/>

      <HomeDesktopLayout
        mapResize={resize}
        map={
          <div
            ref={mapContainerRef}
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              zIndex:0,
              top:'0',
              left:'0'

            }}
          />
        }
        mapOverlay={<OrderMapOverlay />}
        plan={
          <SectionPanel style={{ width: layout.planWidth}}
            parentParams={{ borderLeft: '#8a8a8a5b' }}
            onRequestClose={layout.closePlan}
          >
            <PlanPage />
          </SectionPanel>
        }
        base={
          <div style={{ width: layout.baseWidth, height: '100%', overflowX:"hidden" }}>
            <SectionPanel style={{ width: layout.planWidth }}
              parentParams={{ borderLeft: '#8a8a8a5b' }}
            >
              <OrderPage />
            </SectionPanel>
          </div>
        }
        orderOverlay={
          baseControlls.isBaseOpen ? (
           <SectionPanel
            onRequestClose={ baseControlls.closeBase }
            style={{width:layout.planWidth}}
           >
             {
             SelectedOrdersPlanType && 
              <SelectedOrdersPlanType payload={baseControlls.payload} />
              }
            </SectionPanel>
          ) : null
        }
        overlay={
            <SectionManagerHost stackKey="dynamicSectionPanels" isBaseOpen={baseControlls.isBaseOpen} width={400}/>
        }
        buttonTogglePlan={
          layout.canTogglePlan ? (
            <BasicButton params = {{ onClick: layout.togglePlan, variant: "ghost", ariaLabel: "Toggle delivery plan" , 
            style:{padding:'29px 6px', backgroundColor:'var(--color-page)',borderRadius:'10px 0 0 10px', border:'1px solid #8a8a8a9c'} 
            }}>
              <ChevronDownIcon className={`w-5 h-5 transition-transform rotate-90 text-[var(--color-muted)]`} />
            </BasicButton>
          ) : null
        }
        isPlanVisible={layout.isPlanVisible}
      />
    </>
  )
}

function HomeDesktopHeader() { 
    const sectionManager = useSectionManager()
    const navigate = useNavigate()
    return (
        <div className="w-full h-14  flex items-center justify-between px-4 border-b border-b-1 border-b-[var(--color-muted)]/50 ">
          <div className="flex items-center">

          </div>
          <div className="flex items-center gap-5 scale-95">
            <BasicButton
              params={{
                variant: 'secondary',
                ariaLabel: 'Notifications',
                className:"border-[var(--color-muted)]/30",
                onClick: () => sectionManager.open({ key: 'orderCase.main' }),
              }}
            >
              <ArchiveIcon className="h-5 w-5 " />
            </BasicButton>
            {/* <BasicButton
              params={{
                variant: 'secondary',
                ariaLabel: 'Notifications',
                onClick: () => {},
              }}
            >
              <BellIcon className="h-5 w-5 " />
            </BasicButton> */}
            <BasicButton
              params={{ 
                variant: 'secondary', 
                ariaLabel: 'Settings',
                className:"border-[var(--color-muted)]/30",
                onClick: ()=> navigate('/settings')
              }}

            >
              <SettingIcon className="h-4 w-4 mr-2 " />
              Settings
            </BasicButton>
          </div>
        </div>
    )
} 
