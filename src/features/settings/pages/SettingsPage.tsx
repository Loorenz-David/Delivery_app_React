import { useEffect, useMemo, useState } from 'react'

import { GridIcon, MailIcon, SliderIcon, UserIcon, UsersIcon } from '../../../assets/icons'

import { SettingsSidebar } from '../components/side_bars/SettingsSidebar.tsx'
import { AccountSectionPanel } from '../components/section_panels/AccountSectionPanel'
import { DeliveryRequestSectionPanel } from '../components/section_panels/DeliveryRequestSectionPanel'
import { MessageSectionPanel } from '../components/section_panels/MessageSectionPanel'
import { ItemPropertiesPanel } from '../components/section_panels/ItemPropertiesPanel'
import { TeamSectionPanel } from '../components/section_panels/TeamSectionPanel'
import { ResourcesManagerProvider } from '../../../resources_manager/resourcesManagerContext'
import { ActionManager, useActionEntries } from '../../../resources_manager/managers/ActionManager'
import Popup_1 from '../../../components/popups/Popup_1'
import { PopupConfirm, PopupConfirmContent } from '../../../components/popups/PopupConfirm'
import { useSettingsStore } from '../../../store/settings/useSettingsStore'


import {popupMap} from '../components/popup_fills/popup_map.tsx'


type SettingsSectionKey = 'account' | 'users' | 'messages' | 'team' | 'itemProperties' | 'deliveryRequest'

const DEFAULT_SECTION: SettingsSectionKey = 'account'

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>(DEFAULT_SECTION)
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1000,
  )
  const isMobileObject = useMemo(
    () => ({
      isMobile: isMobileViewport,
      isMenuOpen: false,
      setIsMobileMenuOpen: () => {},
      setIsMobileViewport,
    }),
    [isMobileViewport],
  )
  const popupManager = useMemo(
    () =>
      new ActionManager({
        blueprint: Popup_1,
        registry: { ...popupMap, Confirm: PopupConfirm },
      }),
    [],
  )
  const popupConfirmationManager = useMemo(
    () =>
      new ActionManager({
        blueprint: PopupConfirm,
        registry: { Confirm: PopupConfirmContent },
      }),
    [],
  )
  const resetDataset = useSettingsStore((state) => state.resetDataset)
  useActionEntries(popupManager)
  useActionEntries(popupConfirmationManager)
  useEffect(() => {
    resetDataset()
  }, [resetDataset])
  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 1000)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarOptions = useMemo(
    () => [
      { key: 'account', label: 'Account', icon: <UserIcon className="app-icon h-4 w-4" /> },
      { key: 'messages', label: 'Messages', icon: <MailIcon className="app-icon h-4 w-4" /> },
      { key: 'deliveryRequest', label: 'Delivery request', icon: <SliderIcon className="app-icon h-4 w-4" /> },
      { key: 'team', label: 'Team properties', icon: <UsersIcon className="app-icon h-4 w-4" /> },
      { key: 'itemProperties', label: 'Item properties', icon: <GridIcon className="app-icon h-4 w-4" /> },
    ],
    [],
  )

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'itemProperties':
        return <ItemPropertiesPanel />
      case 'messages':
        return <MessageSectionPanel />
      case 'deliveryRequest':
        return <DeliveryRequestSectionPanel />
      case 'team':
        return <TeamSectionPanel />
      case 'account':
      default:
        return <AccountSectionPanel />
    }
  }, [activeSection])

  return (
    <ResourcesManagerProvider
      managers={{
        settingsPopupManager: popupManager,
        popupManager,
        popupConfirmationManager,
        isMobileObject,
      }}
    >
      <div className="flex h-screen bg-[var(--color-page)] text-[var(--color-text)]">
        <SettingsSidebar
          options={sidebarOptions}
          activeKey={activeSection}
          onSelect={(key) => setActiveSection(key as SettingsSectionKey)}
        />
        <section className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex h-full max-w-5xl flex-col gap-6">{activeContent}</div>
        </section>
      </div>
      {popupManager.renderStack()}
      {popupConfirmationManager.renderStack()}
    </ResourcesManagerProvider>
  )
}
