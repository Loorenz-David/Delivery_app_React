import { useState } from 'react'


type HomeDesktopLayoutParams = {
  openSectionsCount?: number
}

export function useHomeDesktopLayout({ openSectionsCount = 0 }: HomeDesktopLayoutParams ) {
  const [isPlanOpen, setIsPlanOpen] = useState(true)

  

  const canTogglePlan = openSectionsCount == 0

  const isPlanVisible = canTogglePlan && isPlanOpen


  const PLAN_WIDTH = 450
  const BASE_WIDTH = 450

  const mapWidth = `calc(100% - ${BASE_WIDTH}px)`

  return {
    isPlanVisible,
    canTogglePlan,
    togglePlan: () => {
      setIsPlanOpen(prev => !prev )
    },
    // layout values (tune later)
    mapFlex: 1,
    baseWidth: BASE_WIDTH,
    planWidth:  PLAN_WIDTH,
    mapWidth
  }
}