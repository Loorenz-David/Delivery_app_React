import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { listPrintTemplates } from '../api/printTemplate.api'
import { upsertPrintTemplates } from '../store'

export const usePrintTemplateFlow = () => {
  const { showMessage } = useMessageManager()

  const loadAllPrintTemplate = async () => {
    try {
      const response = await listPrintTemplates()
      const templates = response?.data?.label_templates
      if (!templates) return null

      upsertPrintTemplates(templates)
      return templates.allIds
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to load print templates.'
      const status = error instanceof ApiError ? error.status : 500
      showMessage({ status, message })
      return null
    }
  }

  

  return {
    loadAllPrintTemplate,
  }
}
