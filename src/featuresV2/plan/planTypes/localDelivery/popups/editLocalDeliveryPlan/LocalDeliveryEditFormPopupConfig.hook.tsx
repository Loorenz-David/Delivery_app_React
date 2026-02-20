import { useEffect } from 'react'

import { ThunderIcon } from '@/assets/icons'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'

type PropsPopupConfig = {
  selectedVariantLabel: string | null
  optimizationDate: string | null
}

export const useLocalDeliveryEditFormPopupConfig = ({selectedVariantLabel, optimizationDate}:PropsPopupConfig) => {

  const { setPopupHeader } = usePopupContext()

  useEffect(() => {
    const description = selectedVariantLabel ? 
    (
    <div className="flex flex-col gap-1">
      <span>Variant: {selectedVariantLabel} </span>
      {optimizationDate && 
        <span>Optimization date: {optimizationDate}</span>
      }
    </div>
    ) : 'Route optimization settings'

    setPopupHeader({
      label: 'Edit route optimization',
      description,
      icon: <ThunderIcon className="h-5 w-5 text-blue-500" />,
    })
  }, [selectedVariantLabel, setPopupHeader])
}
