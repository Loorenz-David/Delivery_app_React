import {createContext, useContext} from 'react'

export interface SectionPanelContextValue {
  setHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
  setInteractionActions?: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
}

export const SectionPanelContext = createContext<SectionPanelContextValue | null>(null)

export function useSectionPanel(){
  const context = useContext(SectionPanelContext)
    if(!context){
      throw new Error("useSectionPanel must be used with in a SectionPanelContext")
    }
    return context
}