import { apiClient } from '../../../lib/api/ApiClient'
import type { ChatNote } from '../types/backend'

export interface AppendChatPayload {
  id: number
  chat: ChatNote | Record<string, unknown>
}

export class ChatService {
  async appendChat(payload: AppendChatPayload) {
    return apiClient.request<Record<string, unknown>>({
      path: '/order/update_order_chat',
      method: 'PUT',
      data: payload,
    })
  }
}
