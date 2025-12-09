import type { SettingsUserProfile } from '../types'
import type { UserAccountPayload } from '../api/accountService'

export function normalizeUserPayload(
  payload: UserAccountPayload,
): SettingsUserProfile {
  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    phone: payload.phone_number ?? null,
    role: payload.role?.role ?? 'Member',
    team: payload.team?.name ?? '—',
    profilePicture: resolveProfilePicture(payload.profile_picture),
    rawRole: payload.role ?? null,
    rawTeam: payload.team ?? null,
  }
}

export function resolveProfilePicture(value: unknown): string | null {
  if (!value) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.url === 'string') {
      return record.url
    }
    if (typeof record.path === 'string') {
      return record.path
    }
    if (typeof record.data_url === 'string') {
      return record.data_url
    }
  }
  return null
}


