import type { ReactNode } from 'react'
import { useState } from 'react'

import { cn } from '../../../../lib/utils/cn'
import { SectionPanelContext } from '../../contexts/SectionPanelContext'

export interface SectionPanelParams {
  icon?: ReactNode
  label: string
  className?: string
  headerActions?: ReactNode[]
  interactionActions?: ReactNode[]
  id?: 0
  position?: 0
  animation?: 'slideRight' | 'fade' | 'expand' | null
  borderLeft?: string
  compact?: boolean
  zIndex?: number
}
interface SectionPanelProps {
  params: SectionPanelParams
  children?: ReactNode
  position?: number
}

export function SectionPanel({ params, children, position = -1 }: SectionPanelProps) {
  position++
  const { icon, label, className, borderLeft, compact = false, zIndex } = params

  const [headerActions, setHeaderActions] = useState<React.ReactNode[]>([])
  const [interactionActions, setInteractionActions] = useState<React.ReactNode[]>([])
  const compactStyle = compact
    ? {
        transform: 'scale(0.85)',
        transformOrigin: 'top left',
      }
    : undefined

  return (
    <SectionPanelContext.Provider value={{ setHeaderActions, setInteractionActions }}>
      <section
        className={cn(' flex flex-col h-full min-h-0 border border-[var(--color-border)] bg-white', className)}
        style={{
          borderLeft: borderLeft ? borderLeft : '',
          zIndex: zIndex ?? undefined,
        }}
       
      >
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex-column border-b-[0.5px] border-gray-300 p-4">
            <div className="flex items-start justify-between gap-3 py-3">
              
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center ">{icon && icon}</div>
                  <span className="text-nowrap text-base font-semibold text-[var(--color-text)]">{label}</span>
                </div>

              <div className="ml-auto flex items-center gap-2">
                {headerActions?.map((action, index) => (
                  <div key={`header-${index}`} style={compactStyle}>
                    {action}
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {interactionActions?.map((action, index) => (
                <div key={`interaction-${index}`} >
                  {action}
                </div>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-3" >
            {children}
          </div>
        </div>
      </section>
    </SectionPanelContext.Provider>
  )
}
