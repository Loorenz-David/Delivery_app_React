
import type { AccountProfileData } from './components/section_cards/AccountProfileCard'
import type { AccountRolePayload, AccountTeamPayload } from './api/accountService'
import type { PhoneValue } from '../../components/forms/PhoneField'

export interface SettingsUserProfile extends AccountProfileData {
  id: number
  email: string
  phone: PhoneValue | null
  rawRole?: AccountRolePayload | null
  rawTeam?: AccountTeamPayload | null
}

export interface SettingsMessageTemplate {
  id: number
  name: string
  content: string
  channel: 'email' | 'sms'
}

export type SettingsDataset = {
  UserInfo: SettingsUserProfile | null
  UsersList: SettingsUserProfile[] | null
  MessageTemplates: SettingsMessageTemplate[] | null
} & Record<string, unknown>
