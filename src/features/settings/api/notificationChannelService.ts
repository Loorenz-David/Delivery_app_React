import { apiClient } from '../../../lib/api/ApiClient'

export interface SmtpPayload {
  smtp_server: string
  smtp_port: number
  smtp_username: string
  smtp_password_encrypted: string
  use_tls: boolean
  use_ssl: boolean
  max_per_session?: number | null
}

export interface TwilioPayload {
  twilio_sid: string
  twilio_token: string
  sender_number: string
}

export interface ChannelStatusResponse {
  smtp: boolean
  twilio: boolean
}

export class NotificationChannelService {
  async areServicesActive() {
    return apiClient.request<ChannelStatusResponse>({
      path: '/notifications/are_services_active',
      method: 'GET',
    })
  }

  async upsertSmtp(payload: SmtpPayload) {
    return apiClient.request({
      path: '/notifications/create_email_smtp',
      method: 'POST',
      data: payload,
    })
  }

  async upsertTwilio(payload: TwilioPayload) {
    return apiClient.request({
      path: '/notifications/create_twilio_mod',
      method: 'POST',
      data: payload,
    })
  }
}
