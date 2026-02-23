import { useEffect, useMemo } from 'react'

import { ThunderIcon } from '@/assets/icons'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { useLocalDeliveryEditFormContextData } from '@/featuresV2/plan/planTypes/localDelivery/forms/localDeliveryEditForm/LocalDeliveryEditFormContextData'

export const useLocalDeliveryEditFormPopupConfig = () => {
  const { selectedRouteSolution } = useLocalDeliveryEditFormContextData()
  const selectedVariantLabel = useMemo(() => {
    if (selectedRouteSolution?.label) return selectedRouteSolution.label
    if (selectedRouteSolution?.id) return `Variant ${selectedRouteSolution.id}`
    return null
  }, [selectedRouteSolution?.id, selectedRouteSolution?.label])
  const optimizationDate = useMemo(() => {
    if (!isOptimized(selectedRouteSolution?.is_optimized)) return null
    return formatOptimizationDate(selectedRouteSolution?.created_at)
  }, [selectedRouteSolution?.created_at, selectedRouteSolution?.is_optimized])

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
  }, [optimizationDate, selectedVariantLabel, setPopupHeader])
}

const isOptimized = (value?: string | null) =>
  value === 'optimize' || value === 'partial optimize'

const formatOptimizationDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
