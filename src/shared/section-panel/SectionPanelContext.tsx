import {useContext, createContext} from 'react'

export type SectionHeaderAction = {
    label: string
    value: string
    icon?: React.ReactNode
    action?: (item: SectionHeaderAction) => void
}

export type SectionHeaderConfig = {
    icon?: React.ReactNode
    title?: React.ReactNode

    actions?: SectionHeaderAction[]
    buttons?: React.ReactNode[]
    closeButton?:boolean
    DotMenuActions?:boolean
    headerButtonsBgClass?: string
}

type SectionPanelContextValue = {
  setHeader: (config: SectionHeaderConfig | null) => void
}

export const SectionPanelContext =
  createContext<SectionPanelContextValue | null>(null)

export const useSectionPanel = () => {
  const ctx = useContext(SectionPanelContext)
  if (!ctx) {
    throw new Error('useSectionPanel must be used inside SectionPanel')
  }
  return ctx
}
