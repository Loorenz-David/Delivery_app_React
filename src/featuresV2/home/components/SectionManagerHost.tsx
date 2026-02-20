import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSectionManager } from '@/shared/resource-manager/useResourceManager'

interface SectionManagerHostProps {
  stackKey: string
  isBaseOpen: boolean
}

type Section ={
  key:string,
  id:string
  isClosing:boolean
}

export function SectionManagerHost({ stackKey, isBaseOpen }: SectionManagerHostProps) {
  const sectionManager = useSectionManager()
  const sectionCount = sectionManager.getOpenCount()

  useEffect(()=>{
    const allowedOpenOnce = new Set(["order.details", 'orderCases.main', 'oderCase.details', "LocalDeliveryStatsPage"])
    const openSections = sectionManager
    .getSnapshot()
    .filter(s=> !s.isClosing)

    const seen= new Map<string,Section>()
    const toClose: string[] = []

    for (const section of openSections){
      if(!allowedOpenOnce.has(section.key)) continue

      const existing = seen.get(section.key)
      if (existing){
        toClose.push( existing.id )
      }
      seen.set( section.key, section )
    }


    toClose.forEach(id => sectionManager.closeExact(id))



  },[sectionCount])

  useEffect(()=>{
    if (!isBaseOpen ){
      sectionManager.closeAll()
    }

  },[isBaseOpen])

  return (
    <AnimatePresence mode="popLayout">
      {sectionManager.renderStack(stackKey)}
    </AnimatePresence>
  )
}