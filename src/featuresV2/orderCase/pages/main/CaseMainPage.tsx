import type { StackComponentProps } from '@/shared/stack-manager/types'

import { OrderCaseList } from '@/featuresV2/orderCase/components/OrderCaseList'
import { OrderCaseMainHeader } from '@/featuresV2/orderCase/components/pageHeaders/OrderCaseMainHeader'

import { useCaseMainContext } from '../../context/main/caseMain.context'
import { CaseMainProvider } from '../../context/main/caseMain.provider'

const CaseMainPageContent = () => {
  const { cases, caseMainActions, query } = useCaseMainContext()
  
  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-page)]">
      <OrderCaseMainHeader
        applySearch={caseMainActions.applySearch}
        updateFilters={caseMainActions.updateFilters}
        deleteFilter={caseMainActions.deleteFilter}
        resetQuery={caseMainActions.resetQuery}
        query={query}
      />
      <div className="flex-1 overflow-y-auto p-3">
        <OrderCaseList
          cases={cases}
          onOpenCase={caseMainActions.openCaseDetails}
        />
      </div>
    </div>
  )
}

export const CaseMainPage = (_props: StackComponentProps<undefined>) => {
  void _props

  return (
    <CaseMainProvider>
      <CaseMainPageContent />
    </CaseMainProvider>
  )
}
