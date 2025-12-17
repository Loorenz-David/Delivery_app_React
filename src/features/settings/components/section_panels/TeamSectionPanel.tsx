import { useCallback, useEffect, useMemo, useState } from 'react'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { useInputWarning } from '../../../../components/forms/useInputWarning'
import { DropDown } from '../../../../components/buttons/DropDown'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { ApiError } from '../../../../lib/api/ApiClient'
import { AccountSettingsService, type UserAccountPayload } from '../../api/accountService'
import { TeamService } from '../../api/teamService'
import { normalizeUserPayload } from '../../utils/userTransformers'
import { SectionPanel, type SectionPanelServices } from './SectionPanel'
import { ReceivedInviteCard } from '../section_cards/ReceivedInviteCard'
import { SentInviteCard } from '../section_cards/SentInviteCard'
import { TeamUserCard } from '../section_cards/TeamUserCard'
import { InputField } from '../../../../components/forms/InputField'
import type {
  SettingsDataset,
  SettingsUserProfile,
  SettingsUserRole,
  TeamInviteReceived,
  TeamInviteSent,
  TeamInfo,
} from '../../types'
import { useSettingsStore, type SettingsDatasetUpdater } from '../../../../store/settings/useSettingsStore'
import { apiClient } from '../../../../lib/api/ApiClient'
import { useNavigate } from 'react-router-dom'

type TeamTab = 'users' | 'sent' | 'received'

const resolveApiMessage = (error: unknown, fallback: string) => {
  const status = error instanceof ApiError ? error.status ?? 500 : 500
  const message = error instanceof ApiError && error.message ? error.message : fallback
  return { status, message }
}

const TABS: Array<{ key: TeamTab; label: string }> = [
  { key: 'users', label: 'Team users' },
  { key: 'sent', label: 'Sent invitations' },
  { key: 'received', label: 'Received invitations' },
]

const DEFAULT_DATASET: SettingsDataset = {
  UserInfo: null,
  UsersList: null,
  MessageTemplates: null,
  TeamInfo: null,
  TeamUsers: null,
  TeamSentInvites: null,
  TeamReceivedInvites: null,
  UserRoles: null,
}

const USER_FILTER_OPTIONS = [
  { value: 'all', label: 'All fields' },
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
]

const buildUserQuery = (value: string, filter: string) => {
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
}

const buildDataset = (dataset: SettingsDataset | null): SettingsDataset => ({
  ...DEFAULT_DATASET,
  ...(dataset ?? {}),
})

export function TeamSectionPanel() {
  const dataset = useSettingsStore((state) => state.dataset)
  const updateDataset = useSettingsStore((state) => state.updateDataset)
  const { showMessage } = useMessageManager()
  const popupConfirmationManager = useResourceManager('popupConfirmationManager')
  const accountService = useMemo(() => new AccountSettingsService(), [])
  const teamService = useMemo(() => new TeamService(), [])
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TeamTab>('users')
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(dataset?.TeamInfo ?? null)
  const [teamNameInput, setTeamNameInput] = useState(teamInfo?.name ?? '')
  const [roles, setRoles] = useState<SettingsUserRole[]>(dataset?.UserRoles ?? [])
  const [isSavingTeam, setIsSavingTeam] = useState(false)

  const ensureDataset = useCallback((dataset: SettingsDataset | null) => buildDataset(dataset), [])

  const loadTeamInfo = useCallback(async () => {
    try {
      const response = await teamService.fetchTeam()
      const record = response.data?.items?.[0]
      if (!record) {
        return
      }
      setTeamInfo(record)
      setTeamNameInput(record.name)
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamInfo = record
        return next
      })
    } catch (error) {
      console.error('Failed to load team info', error)
      showMessage(resolveApiMessage(error, 'Unable to load team info.'))
    }
  }, [ensureDataset, showMessage, teamService, updateDataset])

  const loadRoles = useCallback(async () => {
    try {
      const response = await teamService.fetchUserRoles()
      const items = response.data?.items ?? []
      setRoles(items)
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.UserRoles = items
        return next
      })
    } catch (error) {
      console.error('Failed to load roles', error)
      showMessage(resolveApiMessage(error, 'Unable to load roles.'))
    }
  }, [ensureDataset, showMessage, teamService, updateDataset])

  const refreshUsers = useCallback(async () => {
    try {
      const response = await accountService.fetchUsers()
      const normalized = (response.data?.items ?? []).map((item) => normalizeUserPayload(item))
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamUsers = normalized
        return next
      })
      return normalized
    } catch (error) {
      console.error('Failed to load users', error)
      showMessage(resolveApiMessage(error, 'Unable to load team users.'))
      return null
    }
  }, [accountService, ensureDataset, showMessage, updateDataset])

  const handleSaveTeamName = useCallback(async () => {
    if (!teamInfo || !teamNameInput.trim() || teamNameInput.trim() === teamInfo.name) {
      return
    }
    setIsSavingTeam(true)
    try {
      const response = await teamService.updateTeam({
        id: teamInfo.id,
        fields: { name: teamNameInput.trim() },
      })
      const payload = response.data
      const updated = payload && 'instance' in payload ? (payload as { instance: TeamInfo }).instance : payload
      const nextTeam = (updated as TeamInfo | null | undefined) ?? { ...teamInfo, name: teamNameInput.trim() }
      setTeamInfo(nextTeam)
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamInfo = nextTeam
        return next
      })
      await loadTeamInfo()
      showMessage({ status: response.status ?? 200, message: response.message ?? 'Team name updated.' })
    } catch (error) {
      console.error('Failed to update team', error)
      showMessage(resolveApiMessage(error, 'Unable to update team name.'))
    } finally {
      setIsSavingTeam(false)
    }
  }, [ensureDataset, loadTeamInfo, showMessage, teamInfo, teamNameInput, teamService, updateDataset])

  const handleLeaveTeam = useCallback(async () => {
    console.log('handleLeaveTeam called')
    popupConfirmationManager.open({
      key: 'Confirm',
      parentParams: {
        header: 'Leave team',
        description: 'You will return to your previous workspace. Are you sure you want to leave this team?',
        confirmLabel: 'Leave team',
        cancelLabel: 'Stay',
        onConfirm: async () => {
          setIsSavingTeam(true)
          try {
            const response = await teamService.leaveTeam()
            const nextAccess = (response.data as { access_token?: string } | null | undefined)?.access_token
            const nextRefresh = (response.data as { refresh_token?: string } | null | undefined)?.refresh_token
            if (nextAccess && nextRefresh) {
              apiClient.replaceTokens(nextAccess, nextRefresh)
            }
            navigate('/settings')
            showMessage({ status: response.status ?? 200, message: response.message ?? 'Left team.' })
          } catch (error) {
            console.error('Failed to leave team', error)
            showMessage(resolveApiMessage(error, 'Unable to leave the team.'))
          } finally {
            setIsSavingTeam(false)
          }
        },
      },
    })
  }, [popupConfirmationManager, showMessage, teamService])

  useEffect(() => {
    if (dataset?.TeamInfo) {
      setTeamInfo(dataset.TeamInfo)
      setTeamNameInput(dataset.TeamInfo.name)
    } else {
      void loadTeamInfo()
    }
  }, [dataset?.TeamInfo, loadTeamInfo])

  useEffect(() => {
    if (dataset?.UserRoles) {
      setRoles(dataset.UserRoles)
      return
    }
    void loadRoles()
  }, [dataset?.UserRoles, loadRoles])

  return (
    <div className="space-y-8">
      <TeamHeader
        teamNameInput={teamNameInput}
        onChangeTeamName={setTeamNameInput}
        onSaveTeamName={() => void handleSaveTeamName()}
        onLeaveTeam={() => void handleLeaveTeam()}
        isSaving={isSavingTeam}
      />

      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Team panels">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`flex min-w-[180px] flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive
                  ? 'bg-[var(--color-accent)] text-[var(--color-text)] shadow-sm'
                  : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'users' ? (
          <UsersTab
            roles={roles}
            accountService={accountService}
            teamService={teamService}
            updateDataset={updateDataset}
            ensureDataset={ensureDataset}
            showMessage={showMessage}
          />
        ) : null}
        {activeTab === 'sent' ? (
          <SentInvitesTab
            roles={roles}
            teamService={teamService}
            updateDataset={updateDataset}
            ensureDataset={ensureDataset}
            showMessage={showMessage}
            initialInvites={dataset?.TeamSentInvites ?? null}
          />
        ) : null}
        {activeTab === 'received' ? (
          <ReceivedInvitesTab
            teamService={teamService}
            updateDataset={updateDataset}
            ensureDataset={ensureDataset}
            showMessage={showMessage}
            initialInvites={dataset?.TeamReceivedInvites ?? null}
            refreshUsers={refreshUsers}
          />
        ) : null}
      </div>
    </div>
  )
}

interface TeamHeaderProps {
  teamNameInput: string
  onChangeTeamName: (value: string) => void
  onSaveTeamName: () => void
  onLeaveTeam: () => void
  isSaving: boolean
}

function TeamHeader({ teamNameInput, onChangeTeamName, onSaveTeamName, onLeaveTeam, isSaving }: TeamHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleToggle = () => {
    if (isEditing) {
      onSaveTeamName()
    }
    setIsEditing((prev) => !prev)
  }

  return (
    <header className="flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Team</p>
          <div className="mt-1 flex items-center gap-2">
            {isEditing ? (
              <InputField
                value={teamNameInput}
                onChange={(event) => onChangeTeamName(event.target.value)}
                placeholder="Team name"
                inputClassName="text-xl font-semibold"
              />
            ) : (
              <p className="w-full text-xl font-semibold text-[var(--color-text)]">{teamNameInput || 'Team name'}</p>
            )}
            <BasicButton
              params={{
                variant: 'primary',
                onClick: handleToggle,
                disabled: isSaving,
              }}
            >
              {isEditing ? 'Save' : 'Edit'}
            </BasicButton>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Share settings and data across teammates. Update the team name or manage membership below.
          </p>
        </div>
        <BasicButton
          params={{
            variant: 'secondary',
            onClick: onLeaveTeam,
            disabled: isSaving,
          }}
        >
          Leave team
        </BasicButton>
      </div>
    </header>
  )
}

interface UsersTabProps {
  roles: SettingsUserRole[]
  accountService: AccountSettingsService
  teamService: TeamService
  updateDataset: SettingsDatasetUpdater
  ensureDataset: (dataset: SettingsDataset | null) => SettingsDataset
  showMessage: (payload: { status: number; message: string }) => void
}

function UsersTab({
  roles,
  accountService,
  teamService,
  updateDataset,
  ensureDataset,
  showMessage,
}: UsersTabProps) {
  const [busyUserId, setBusyUserId] = useState<number | null>(null)
  const popupConfirmationManager = useResourceManager('popupConfirmationManager')
  const services = useMemo<SectionPanelServices<UserAccountPayload, Record<string, unknown>>>(
    () => ({
      queryAllService: async () => {
        const response = await accountService.fetchUsers()
        return { data: { items: response.data?.items ?? [] } }
      },
      queryByInputService: async (queryFilters: Record<string, unknown>) => {
        const response = await accountService.fetchUsers(queryFilters)
        return { data: { items: response.data?.items ?? [] } }
      },
    }),
    [accountService],
  )

  const handleRoleChange = useCallback(
    async (user: SettingsUserProfile, roleId: number | null) => {
      if (roleId === (user.rawRole?.id ?? null)) {
        return
      }
      setBusyUserId(user.id)
      try {
        const response = await accountService.updateUser({
          id: user.id,
          fields: { role_id: roleId },
        })
        const updatedRole = roles.find((role) => role.id === roleId) ?? null
        const updatedUser: SettingsUserProfile = {
          ...user,
          rawRole: updatedRole,
          role: updatedRole?.role ?? user.role,
        }
        updateDataset((prev) => {
          const next = ensureDataset(prev)
          const list = Array.isArray(next.TeamUsers) ? next.TeamUsers : []
          next.TeamUsers = list.map((candidate) => (candidate.id === user.id ? updatedUser : candidate))
          return next
        })
        showMessage({ status: response.status ?? 200, message: response.message ?? 'Role updated.' })
      } catch (error) {
        console.error('Failed to update role', error)
        showMessage(resolveApiMessage(error, 'Unable to update role.'))
      } finally {
        setBusyUserId(null)
      }
    },
    [accountService, ensureDataset, roles, showMessage, updateDataset],
  )

  const handleKickUser = useCallback(
    async (user: SettingsUserProfile) => {

      popupConfirmationManager.open({
        key: 'Confirm',
        parentParams: {
          header: 'Remove user',
          description: `Remove ${user.username} from the team?`,
          confirmLabel: 'Remove',
          cancelLabel: 'Cancel',
          onConfirm: async () => {
            setBusyUserId(user.id)
            try {
              const response = await teamService.kickUser({ username: user.username, email: user.email })
              updateDataset((prev) => {
                const next = ensureDataset(prev)
                const list = Array.isArray(next.TeamUsers) ? next.TeamUsers : []
                next.TeamUsers = list.filter((candidate) => candidate.id !== user.id)
                return next
              })
              showMessage({ status: response.status ?? 200, message: response.message ?? 'User removed.' })
            } catch (error) {
              console.error('Failed to remove user', error)
              showMessage(resolveApiMessage(error, 'Unable to remove user from team.'))
            } finally {
              setBusyUserId(null)
            }
          },
        },
      })
    },
    [ensureDataset, popupConfirmationManager, showMessage, teamService, updateDataset],
  )

  return (
    <SectionPanel<SettingsUserProfile, Record<string, unknown>, UserAccountPayload>
      eyebrow="Users"
      title="Team directory"
      description="Search and manage user roles."
      dataManagerKey="TeamUsers"
      createButtonLabel="Create user"
      hideCreateButton
      services={services}
      normalize={(item) => normalizeUserPayload(item)}
      searchFilterOptions={USER_FILTER_OPTIONS}
      defaultSearchFilter="all"
      searchBuildQuery={buildUserQuery}
      searchPlaceholder="Search users"
      emptyStateMessage="No users found."
      loadingStateMessage="Loading users..."
      counterLabel={(count) => `${count} users found.`}
      getItemKey={(user) => user.id}
      onCreate={() => undefined}
      renderObjectCard={(user) => (
        <TeamUserCard
          user={user}
          roles={roles}
          isBusy={busyUserId === user.id}
          onRoleChange={(roleId) => void handleRoleChange(user, roleId)}
          onKick={() => void handleKickUser(user)}
        />
      )}
    />
  )
}

interface SentInvitesTabProps {
  roles: SettingsUserRole[]
  teamService: TeamService
  updateDataset: SettingsDatasetUpdater
  ensureDataset: (dataset: SettingsDataset | null) => SettingsDataset
  showMessage: (payload: { status: number; message: string }) => void
  initialInvites: TeamInviteSent[] | null
}

function SentInvitesTab({
  roles,
  teamService,
  updateDataset,
  ensureDataset,
  showMessage,
  initialInvites,
}: SentInvitesTabProps) {
  const [invites, setInvites] = useState<TeamInviteSent[]>(initialInvites ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [busyInviteId, setBusyInviteId] = useState<number | null>(null)
  const [inviteForm, setInviteForm] = useState<{ username: string; email: string; role_id: number | null }>({
    username: '',
    email: '',
    role_id: null,
  })
  const usernameWarning = useInputWarning('Username is required.')
  const emailWarning = useInputWarning('Email is required.')

  const refreshSentInvites = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await teamService.fetchSentInvitations()
      const items = response.data?.items ?? []
      setInvites(items)
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamSentInvites = items
        return next
      })
    } catch (error) {
      console.error('Failed to load sent invites', error)
      showMessage(resolveApiMessage(error, 'Unable to load invitations.'))
    } finally {
      setIsLoading(false)
    }
  }, [ensureDataset, showMessage, teamService, updateDataset])

  useEffect(() => {
    if (initialInvites === null) {
      void refreshSentInvites()
    }
  }, [initialInvites, refreshSentInvites])

  const handleSendInvite = useCallback(async () => {
    usernameWarning.hideWarning()
    emailWarning.hideWarning()
    if (!inviteForm.username.trim()) {
      usernameWarning.showWarning()
      return
    }
    if (!inviteForm.email.trim()) {
      emailWarning.showWarning()
      return
    }
    setIsLoading(true)
    try {
      const response = await teamService.sendInvitation({
        username: inviteForm.username.trim(),
        email: inviteForm.email.trim(),
        role_id: inviteForm.role_id ?? undefined,
      })
      showMessage({ status: response.status ?? 200, message: response.message ?? 'Invitation sent.' })
      setInviteForm({ username: '', email: '', role_id: null })
      await refreshSentInvites()
    } catch (error) {
      console.error('Failed to send invite', error)
      const status = error instanceof ApiError ? error.status ?? 500 : 500
      const message =
        error instanceof ApiError && error.message ? error.message : 'Unable to send invitation.'
      showMessage({ status, message })
      setIsLoading(false)
    }
  }, [inviteForm.email, inviteForm.role_id, inviteForm.username, refreshSentInvites, showMessage, teamService])

  const handleRemoveInvite = useCallback(
    async (inviteId: number) => {
      setBusyInviteId(inviteId)
      try {
        const response = await teamService.deleteSentInvitation({ sent_invite_id: inviteId })
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
        updateDataset((prev) => {
          const next = ensureDataset(prev)
          next.TeamSentInvites = (next.TeamSentInvites ?? []).filter((invite) => invite.id !== inviteId)
          return next
        })
        showMessage({ status: response.status ?? 200, message: response.message ?? 'Invitation removed.' })
      } catch (error) {
        console.error('Failed to delete invite', error)
        const status = error instanceof ApiError ? error.status ?? 500 : 500
        const message =
          error instanceof ApiError && error.message ? error.message : 'Unable to delete invitation.'
        showMessage({ status, message })
      } finally {
        setBusyInviteId(null)
      }
    },
    [ensureDataset, showMessage, teamService, updateDataset],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Send invitation</p>
        <div className="grid gap-3 md:grid-cols-3">
          <InputField
            value={inviteForm.username}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Username"
          />
          <InputField
            value={inviteForm.email}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
          />
          <DropDown
            options={[{ value: '', display: 'Optional role' }, ...roles.map((role) => ({ value: role.id, display: role.role }))]}
            state={[
              inviteForm.role_id ?? '',
              (next) =>
                setInviteForm((prev) => ({
                  ...prev,
                  role_id: next === '' ? null : Number(next),
                })),
            ]}
            buttonClassName="gap-2 items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
            className="text-sm"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <BasicButton
            params={{
              variant: 'primary',
              onClick: () => void handleSendInvite(),
              disabled: isLoading,
            }}
          >
            Send invite
          </BasicButton>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading invitations...</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No invitations sent.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {invites.map((invite) => (
            <SentInviteCard
              key={invite.id}
              invite={invite}
              isBusy={busyInviteId === invite.id}
              onRemove={() => void handleRemoveInvite(invite.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ReceivedInvitesTabProps {
  teamService: TeamService
  updateDataset: SettingsDatasetUpdater
  ensureDataset: (dataset: SettingsDataset | null) => SettingsDataset
  showMessage: (payload: { status: number; message: string }) => void
  initialInvites: TeamInviteReceived[] | null
  refreshUsers: () => Promise<SettingsUserProfile[] | null>
}

function ReceivedInvitesTab({
  teamService,
  updateDataset,
  ensureDataset,
  showMessage,
  initialInvites,
  refreshUsers,
}: ReceivedInvitesTabProps) {
  const [invites, setInvites] = useState<TeamInviteReceived[]>(initialInvites ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [busyInviteId, setBusyInviteId] = useState<number | null>(null)

  const refreshReceivedInvites = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await teamService.fetchReceivedInvitations()
      const items = response.data?.items ?? []
      setInvites(items)
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamReceivedInvites = items
        return next
      })
    } catch (error) {
      console.error('Failed to load received invites', error)
      showMessage(resolveApiMessage(error, 'Unable to load invitations.'))
    } finally {
      setIsLoading(false)
    }
  }, [ensureDataset, showMessage, teamService, updateDataset])

  useEffect(() => {
    if (initialInvites === null) {
      void refreshReceivedInvites()
    }
  }, [initialInvites, refreshReceivedInvites])

  const handleInviteAction = useCallback(
    async (inviteId: number, action: 'accept' | 'reject') => {
      setBusyInviteId(inviteId)
    try {
      const response = await teamService.respondToInvitation({ invitation_instance_id: inviteId, action })
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
      updateDataset((prev) => {
        const next = ensureDataset(prev)
        next.TeamReceivedInvites = (next.TeamReceivedInvites ?? []).filter((invite) => invite.id !== inviteId)
        return next
      })
      showMessage({
        status: response.status ?? 200,
        message: response.message ?? (action === 'accept' ? 'Invitation accepted.' : 'Invitation rejected.'),
      })
      if (action === 'accept') {
        const nextAccess = (response.data as { access_token?: string } | null | undefined)?.access_token
        const nextRefresh = (response.data as { refresh_token?: string } | null | undefined)?.refresh_token
        if (nextAccess && nextRefresh) {
          apiClient.replaceTokens(nextAccess, nextRefresh)
        }
        await refreshUsers()
      }
    } catch (error) {
      console.error('Failed to process invite', error)
      showMessage(resolveApiMessage(error, 'Unable to process invitation.'))
    } finally {
      setBusyInviteId(null)
    }
  },
    [ensureDataset, refreshUsers, showMessage, teamService, updateDataset],
  )

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading invitations...</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No invitations received.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {invites.map((invite) => (
            <ReceivedInviteCard
              key={invite.id}
              invite={invite}
              isBusy={busyInviteId === invite.id}
              onAccept={() => void handleInviteAction(invite.id, 'accept')}
              onReject={() => void handleInviteAction(invite.id, 'reject')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
