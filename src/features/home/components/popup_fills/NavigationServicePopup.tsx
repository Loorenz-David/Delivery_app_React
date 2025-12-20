import { useEffect, useState } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { CheckMarkIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon } from '../../../../assets/icons'
import type { NavigationService } from '../section_panels/utils/navigationHelpers'

interface NavigationServicePopupPayload {
  onSelect: (service: NavigationService, remember: boolean) => void
  current?: NavigationService | null
  setHeader?: (node: React.ReactNode) => void
}

const OPTIONS: Array<{
  value: NavigationService
  label: string
  description: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = [
  { value: 'google', label: 'Google Maps', description: 'Fast routes with traffic', Icon: GoogleMapsIcon },
  { value: 'apple', label: 'Apple Maps', description: 'Native iOS navigation', Icon: AppleMapsIcon },
  { value: 'waze', label: 'Waze', description: 'Crowd-sourced driving alerts', Icon: WazeIcon },
]

export function NavigationServicePopup({
  payload,
  onClose,
  setIsLoading: _setIsLoading,
}: ActionComponentProps<NavigationServicePopupPayload>) {
  const [selected, setSelected] = useState<NavigationService>(payload?.current ?? 'google')
  const [rememberChoice, setRememberChoice] = useState(false)

  const handleConfirm = () => {
    payload?.onSelect?.(selected, rememberChoice)
    onClose?.()
  }

  useEffect(() => {
    if (payload?.setHeader) {
      payload.setHeader(
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">Choose navigation app</p>
          <p className="text-xs text-[var(--color-muted)]">Pick where to open this address.</p>
        </div>,
      )
    }
  }, [payload])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {OPTIONS.map(({ value, label, description, Icon }) => {
          const isActive = selected === value
          return (
            <button
              key={value}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-accent)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
              onClick={() => setSelected(value)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-page)]">
                <Icon className=" h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
                <p className="text-xs text-[var(--color-muted)]">{description}</p>
              </div>
              {isActive ? <CheckMarkIcon className="app-icon h-4 w-4 text-[var(--color-primary)]" /> : null}
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={rememberChoice}
          onChange={(event) => setRememberChoice(event.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-border)]"
        />
        Don't ask again
      </label>

      <div className="flex justify-end gap-2 pt-2">
       
        <BasicButton
          params={{
            variant: 'primary',
            onClick: handleConfirm,
          }}
        >
          Continue
        </BasicButton>
      </div>
    </div>
  )
}

export default NavigationServicePopup
