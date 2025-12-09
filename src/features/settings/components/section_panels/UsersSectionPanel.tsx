import { useCallback, useMemo } from 'react'

import { UserCard } from '../section_cards/UserCard'
import { AccountSettingsService, type UserAccountPayload } from '../../api/accountService'
import { normalizeUserPayload } from '../../utils/userTransformers'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { SectionPanel } from './SectionPanel'
import type { SettingsUserProfile } from '../../types'

interface UsersSectionPanelProps {
  phoneOptions: Array<{ value: string; display: string }>
}

export function UsersSectionPanel({ phoneOptions }: UsersSectionPanelProps) {
  const accountService = useMemo(() => new AccountSettingsService(), [])
  const popupManager = useResourceManager('settingsPopupManager')

  const services = useMemo(
    () => ({
      queryAllService: () => accountService.fetchUsers(),
      queryByInputService: (queryFilters: Record<string, unknown>) => accountService.fetchUsers(queryFilters),
    }),
    [accountService],
  )

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All fields' },
      { value: 'username', label: 'Username' },
      { value: 'email', label: 'Email' },
    ],
    [],
  )

  const buildQuery = useCallback((value: string, filter: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    if (filter === 'username' || filter === 'email') {
      return {
        query: {
          [filter]: {
            operation: 'ilike',
            value: `%${trimmed}%`,
          },
        },
      }
    }
    return {
      query: {
        'or-user': {
          username: {
            operation: 'ilike',
            value: `%${trimmed}%`,
          },
          email: {
            operation: 'ilike',
            value: `%${trimmed}%`,
          },
        },
      },
    }
  }, [])

  return (
    <SectionPanel<SettingsUserProfile, Record<string, unknown>, UserAccountPayload>
      eyebrow="Users"
      title="Team directory"
      description="Search, create, and manage user accounts."
      dataManagerKey="UsersList"
      createButtonLabel="Create user"
      services={services}
      normalize={(item) => normalizeUserPayload(item)}
      searchFilterOptions={filterOptions}
      defaultSearchFilter="all"
      searchBuildQuery={buildQuery}
      searchPlaceholder="Search users"
      emptyStateMessage="No users found."
      loadingStateMessage="Loading users..."
      counterLabel={(count) => `${count} users found.`}
      getItemKey={(user) => user.id}
      onCreate={() =>
        popupManager.open({
          key: 'FillUserAccount',
          payload: { mode: 'create', phoneOptions, user: null },
        })
      }
      renderObjectCard={(user) => (
        <UserCard
          user={user}
          onEdit={(candidate) =>
            popupManager.open({
              key: 'FillUserAccount',
              payload: { mode: 'manage', user: candidate, phoneOptions },
            })
          }
        />
      )}
    />
  )
}
