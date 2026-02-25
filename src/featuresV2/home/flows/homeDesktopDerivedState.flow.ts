import { useMemo } from 'react'

import { planSectionsMap } from '@/featuresV2/plan'
import { useStackActionEntries } from '@/shared/stack-manager/useStackActionEntries'
import type { usePayloadBaseControlls } from '../hooks/useBaseControlls'
import type { StackActionManager } from '@/shared/stack-manager/StackActionManager'

type BaseControls = ReturnType<typeof usePayloadBaseControlls>

export const useHomeDesktopDerivedStateFlow = ({
  sectionManager,
  baseControlls,
}: {
  sectionManager: StackActionManager<Record<string, unknown>>
  baseControlls: BaseControls
}) => {
  const sectionEntries = useStackActionEntries(sectionManager)

  return useMemo(() => {
    const openSectionsCount = sectionEntries.filter((entry) => !entry.isClosing).length
    const ordersPlanType = baseControlls.payload?.ordersPlanType ?? null
    const isLocalDeliveryOverlayActive =
      baseControlls.isBaseOpen && ordersPlanType === 'local_delivery'
    const SelectedOrdersPlanType = ordersPlanType ? planSectionsMap[ordersPlanType] : null

    return {
      openSectionsCount,
      ordersPlanType,
      isLocalDeliveryOverlayActive,
      SelectedOrdersPlanType,
    }
  }, [baseControlls.isBaseOpen, baseControlls.payload?.ordersPlanType, sectionEntries])
}
