// PopupProvider.tsx
import { useState } from 'react'
import { PopupContextProvider } from './PopupContext'
import { useCloseGuard } from './useCloseGuard'
import type { parentParams, PropsHeaderConfig } from './MainPopup.types'



type PropsPopupProvider = {
    children: React.ReactNode
    onRequestClose: () => void
    parentParams?: parentParams

}

export const MainPopupProvider = ({ children, onRequestClose, parentParams }: PropsPopupProvider) => {
  const [headerConfig, setPopupHeader] = useState<PropsHeaderConfig | null>(null)


  const closeGuards = useCloseGuard({ onRequestClose })

  return (
    <PopupContextProvider
      value={{
        headerConfig,
        setPopupHeader,
        parentParams,
        ...closeGuards
      }}
    >
      {children}
    </PopupContextProvider>
  )
}