import { useMemo, useState } from 'react'

import { GridIcon, MailIcon, UserIcon, UsersIcon } from '../../../assets/icons'

import { SettingsSidebar } from '../components/side_bars/SettingsSidebar.tsx'
import { AccountSectionPanel } from '../components/section_panels/AccountSectionPanel'
import { UsersSectionPanel } from '../components/section_panels/UsersSectionPanel'
import { MessageSectionPanel } from '../components/section_panels/MessageSectionPanel'
import { ItemPropertiesPanel } from '../components/section_panels/ItemPropertiesPanel'
import { DataManager } from '../../../resources_manager/managers/DataManager'
import { ResourcesManagerProvider } from '../../../resources_manager/resourcesManagerContext'
import type { SettingsDataset } from '../types'
import { ActionManager, useActionEntries } from '../../../resources_manager/managers/ActionManager'
import Popup_1 from '../../../components/popups/Popup_1'


import {popupMap} from '../components/popup_fills/popup_map.tsx'


type SettingsSectionKey = 'account' | 'users' | 'messages' | 'team' | 'itemProperties'

const DEFAULT_SECTION: SettingsSectionKey = 'account'

const PHONE_OPTIONS = [
  { value: '+1', display: '+1' },
  { value: '+34', display: '+34' },
  { value: '+44', display: '+44' },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>(DEFAULT_SECTION)
  const settingsDataManager = useMemo(
    () =>
      new DataManager<SettingsDataset>({
        dataset: {
          UserInfo: null,
          UsersList: null,
          MessageTemplates: null,
        },
        activeSelections: {},
        isLoading: false,
      }),
    [],
  )
  const popupManager = useMemo(
    () =>
      new ActionManager({
        blueprint: Popup_1,
        registry: popupMap,
      }),
    [],
  )
  useActionEntries(popupManager)

  const sidebarOptions = useMemo(
    () => [
      { key: 'account', label: 'Account', icon: <UserIcon className="app-icon h-4 w-4" /> },
      { key: 'users', label: 'Users', icon: <UsersIcon className="app-icon h-4 w-4" /> },
      { key: 'messages', label: 'Messages', icon: <MailIcon className="app-icon h-4 w-4" /> },
      { key: 'team', label: 'Team properties', icon: <UsersIcon className="app-icon h-4 w-4" /> },
      { key: 'itemProperties', label: 'Item properties', icon: <GridIcon className="app-icon h-4 w-4" /> },
    ],
    [],
  )

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'itemProperties':
        return <ItemPropertiesPanel />
      case 'users':
        return <UsersSectionPanel phoneOptions={PHONE_OPTIONS} />
      case 'messages':
        return <MessageSectionPanel />
      case 'account':
      default:
        return <AccountSectionPanel />
    }
  }, [activeSection])

  return (
    <ResourcesManagerProvider
      managers={{
        settingsDataManager,
        settingsPopupManager: popupManager,
        popupManager,
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
    </ResourcesManagerProvider>
  )
}
