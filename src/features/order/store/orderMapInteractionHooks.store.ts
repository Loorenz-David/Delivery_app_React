import { useShallow } from 'zustand/react/shallow'

import { useOrderMapInteractionStore } from './orderMapInteraction.store'

export const useHoveredOrderClientId = () =>
  useOrderMapInteractionStore((state) => state.hoveredClientId)

export const useOrderMapInteractionActions = () =>
  useOrderMapInteractionStore(
    useShallow((state) => ({
      setHovered: state.setHovered,
      clearHovered: state.clearHovered,
    })),
  )
