
import type { AccountProfileData } from './components/section_cards/AccountProfileCard'
import type { AccountRolePayload, AccountTeamPayload } from './api/accountService'
import type { PhoneValue } from '../../components/forms/PhoneField'
import type {
  ItemCategoryDetails,
  ItemPositionDetails,
  ItemPropertyPayload,
  ItemStateDetails,
  ItemTypeDetails,
} from './api/itemPropertiesService'

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

export interface TeamInfo {
  id: number
  name: string
}

export interface SettingsUserRole {
  id: number
  role: string
}

export interface TeamInviteSent {
  id: number
  username: string
  email: string
  date?: string
}

export interface TeamInviteReceived {
  id: number
  team_name: string
  date?: string
}

export type SettingsDataset = {
  UserInfo: SettingsUserProfile | null
  UsersList: SettingsUserProfile[] | null
  MessageTemplates: SettingsMessageTemplate[] | null
  TeamInfo?: TeamInfo | null
  TeamUsers?: SettingsUserProfile[] | null
  TeamSentInvites?: TeamInviteSent[] | null
  TeamReceivedInvites?: TeamInviteReceived[] | null
  UserRoles?: SettingsUserRole[] | null
  ItemStates?: ItemStateDetails[] | null
  ItemPositions?: ItemPositionDetails[] | null
  ItemTypes?: ItemTypeDetails[] | null
  ItemCategories?: ItemCategoryDetails[] | null
  ItemSubProperties?: ItemPropertyPayload[] | null
} & Record<string, unknown>
