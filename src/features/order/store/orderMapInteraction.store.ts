import { create } from 'zustand'

export type OrderMapHoverSource = 'list' | 'map'

type OrderMapInteractionState = {
  hoveredClientId: string | null
  hoverSource: OrderMapHoverSource | null
  setHovered: (clientId: string, source: OrderMapHoverSource) => void
  clearHovered: (source?: OrderMapHoverSource) => void
}

export const useOrderMapInteractionStore = create<OrderMapInteractionState>((set) => ({
  hoveredClientId: null,
  hoverSource: null,
  setHovered: (clientId, source) =>
    set((state) => {
      if (state.hoveredClientId === clientId && state.hoverSource === source) {
        return state
      }
      return {
        ...state,
        hoveredClientId: clientId,
        hoverSource: source,
      }
    }),
  clearHovered: (source) =>
    set((state) => {
      if (source && state.hoverSource !== source) {
        return state
      }
      if (state.hoveredClientId == null && state.hoverSource == null) {
        return state
      }
      return {
        ...state,
        hoveredClientId: null,
        hoverSource: null,
      }
    }),
}))
