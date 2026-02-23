import { useMemo } from 'react'

import { CheckMarkIcon, ThunderIcon } from '@/assets/icons'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { DropdownButton } from '@/shared/buttons/DropdownButton'

import {
  useRouteOptimizationMutations,
  useRouteOptimizationPayload,
} from '@/featuresV2/plan/planTypes/localDelivery/controllers/routeOptimization.controller'
import { useRouteSolutionMutations } from '@/featuresV2/plan/planTypes/localDelivery/controllers/routeSolution.controller'
import {
  useRouteSolutionsByLocalDeliveryPlanId,
  useSelectedRouteSolutionByLocalDeliveryPlanId,

} from '@/featuresV2/plan/planTypes/localDelivery/store/useRouteSolution.selector'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'

type Props = {
  localDeliveryPlanId?: number | null
  planId?: number | null
  className?: string
  borderColor?:string
}

const isOptimized = (solution?: RouteSolution | null) =>
  solution?.is_optimized === 'optimize' || solution?.is_optimized === 'partial optimize'

export const RouteOptimizationDropdownButton = ({
  localDeliveryPlanId,
  planId,
  className,
  borderColor,
}: Props) => {
  const solutions = useRouteSolutionsByLocalDeliveryPlanId(localDeliveryPlanId)

  const selectedSolution = useSelectedRouteSolutionByLocalDeliveryPlanId(localDeliveryPlanId)
  const { createOptimization, updateOptimization } = useRouteOptimizationMutations()
  const buildOptimizationPayload = useRouteOptimizationPayload({
    planId,
    localDeliveryPlanId,
    selectedSolution,
  })
  const { selectRouteSolution } = useRouteSolutionMutations()
  const bestSolutionId = useMemo(() => {
    const scored = solutions.filter((solution) => typeof solution.score === 'number')
    if (!scored.length) return null
    return scored.reduce((best, current) =>
      (current.score ?? Infinity) < (best.score ?? Infinity) ? current : best,
    ).id
  }, [solutions])
 

  const orderedSolutions = useMemo(
    () =>
      [...solutions].sort((a, b) => {
        const aLabel = (a.label || '').toLowerCase()
        const bLabel = (b.label || '').toLowerCase()
        if (aLabel && bLabel) return aLabel.localeCompare(bLabel)
        return (a.id ?? 0) - (b.id ?? 0)
      }),
    [solutions],
  )

  const selectedOptimized = isOptimized(selectedSolution)

  const handleOptimize = () => {
    const payload = buildOptimizationPayload()
    if (!payload) return
    if (selectedOptimized) {
      updateOptimization(payload)
      return
    }
    createOptimization(payload)
  }

  const handleReOptimize = () => {
    const payload = buildOptimizationPayload()
    if (!payload) return
    createOptimization(payload)
  }

  const handleSelectVariant = (solution: RouteSolution) => {
    if (!solution?.id) return
    selectRouteSolution(solution.id, localDeliveryPlanId)
  }

  const primaryLabel = selectedOptimized ? 'Update optimization' : 'Optimize route'

  return (
    <DropdownButton
      className={className}
      borderColor={borderColor}
      fullWidth
      label={
        <div className="flex gap-2 items-center w-full py-1 justify-center">
          <ThunderIcon className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-blue-500">{primaryLabel}</span>
        </div>
      }

      variant="secondary"
      onClick={handleOptimize}
    >
      <div className="w-full">
        <div className="max-h-[300px] overflow-y-auto">
          {orderedSolutions.length ? (
            orderedSolutions.map((solution, index) => {
              const label = solution.label || `variant ${index + 1}`
              const isSelected = solution.is_selected
              const isBest = solution.id === bestSolutionId
              return (
                <button
                  key={solution.client_id}
                  type="button"
                  className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-[var(--color-muted)]/10"
                  onClick={() => handleSelectVariant(solution)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-left">{label}</span>
                    {isBest ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-muted)]/20 text-[var(--color-muted)]">
                        Best
                      </span>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <CheckMarkIcon className="h-4 w-4" />
                  ) : null}
                </button>
              )
            })
          ) : (
            <div className="px-2 py-2 text-sm text-[var(--color-muted)]">
              No route variants yet.
            </div>
          )}
        </div>

        {selectedOptimized ? (
          <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
            <BasicButton
              params={{
                variant: 'secondary',
                onClick: handleReOptimize,
                className: 'w-full',
              }}
            >
              Re-optimize
            </BasicButton>
          </div>
        ) : null}
      </div>
    </DropdownButton>
  )
}
