import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { apiClient } from '../../../../lib/api/ApiClient'

interface SettingsSidebarOption {
  key: string
  label: string
  icon: ReactNode
}

interface SettingsSidebarProps {
  options: SettingsSidebarOption[]
  activeKey: string
  onSelect: (key: string) => void
}

export function SettingsSidebar({ options, activeKey, onSelect }: SettingsSidebarProps) {
  const navigate = useNavigate()
  return (
    <aside className="flex h-full w-[350px] flex-col border-r border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Settings</p>
        <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">Manage your workspace</p>
        <BasicButton
          params={{
            variant: 'secondary',
            className: 'mt-4',
            onClick: () => navigate('/'),
          }}
        >
          Back to routes
        </BasicButton>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {options.map((option) => {
            const isActive = activeKey === option.key
            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => onSelect(option.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-page)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-[var(--color-border)] px-6 py-6">
        <BasicButton
          params={{
            variant: 'secondary',
            className: 'w-full',
            onClick: () => {
              apiClient.replaceTokens('', '')
              navigate('/auth')
            },
          }}
        >
          Log out
        </BasicButton>
      </div>
    </aside>
  )
}
