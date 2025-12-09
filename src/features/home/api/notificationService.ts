import { apiClient } from '../../../lib/api/ApiClient'
import type { OrderPayload } from '../types/backend'

export interface NotificationSendPayload {
  templates_id: Partial<Record<'email' | 'sms', number>>
  target_clients: OrderPayload[]
}

export interface ChannelReport {
  sent_sms?: OrderPayload[]
  fail_sms?: OrderPayload[]
  sent_emails?: OrderPayload[]
  fail_emails?: OrderPayload[]
}

export interface NotificationSendReport {
  sms?: {
    sent_sms: OrderPayload[]
    fail_sms: OrderPayload[]
  }
  email?: {
    sent_emails: OrderPayload[]
    fail_emails: OrderPayload[]
  }
}

export class NotificationService {
  async sendNotifications(payload: NotificationSendPayload) {
    return apiClient.request<NotificationSendReport>({
      path: '/notifications/send_notification',
      method: 'POST',
      data: payload,
    })
  }
}
