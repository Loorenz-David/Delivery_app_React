import { apiClient } from '../../../lib/api/ApiClient'
import type { ApiResult } from '../../../lib/api/types'

export type PrintTemplateTarget = 'order' | 'items' | string

export interface PrintLabelTemplate {
  id: number
  template_string: string
  template_target: PrintTemplateTarget
  timestampt?: string
  name?: string
}

export class PrintTemplateService {
  async fetchTemplates(): Promise<ApiResult<{ items: PrintLabelTemplate[] }>> {
    return apiClient.request<{ items: PrintLabelTemplate[] }>({
      path: '/user/query_templates_for_printing',
      method: 'POST',
      data: { query: {} },
    })
  }
}
