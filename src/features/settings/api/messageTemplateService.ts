import { apiClient } from '../../../lib/api/ApiClient'
import type { ApiResult } from '../../../lib/api/types'
import type { SettingsMessageTemplate } from '../types'

export interface MessageTemplateQueryPayload {
  query?: Record<string, unknown>
}

export interface CreateMessageTemplatePayload {
  name: string
  content: string
  channel: 'email' | 'sms'
}

export interface UpdateMessageTemplatePayload {
  id: number
  fields: Partial<CreateMessageTemplatePayload>
}

export class MessageTemplateService {
  async fetchTemplates(payload?: MessageTemplateQueryPayload): Promise<ApiResult<{ items: SettingsMessageTemplate[] }>> {
    return apiClient.request<{ items: SettingsMessageTemplate[] }>({
      path: '/notifications/query_message_template',
      method: 'POST',
      data: payload ?? { query: {} },
    })
  }

  async createTemplate(payload: CreateMessageTemplatePayload): Promise<ApiResult<SettingsMessageTemplate | { instance: SettingsMessageTemplate }>> {
    return apiClient.request<SettingsMessageTemplate | { instance: SettingsMessageTemplate }>({
      path: '/notifications/create_message_template',
      method: 'POST',
      data: payload,
    })
  }

  async updateTemplate(payload: UpdateMessageTemplatePayload): Promise<ApiResult<SettingsMessageTemplate | { instance: SettingsMessageTemplate }>> {
    return apiClient.request<SettingsMessageTemplate | { instance: SettingsMessageTemplate }>({
      path: '/notifications/update_message_template',
      method: 'PUT',
      data: payload,
    })
  }
}
