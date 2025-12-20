import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'

import { CameraIcon } from '../../../../assets/icons'

import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { PhoneField, type PhoneValue } from '../../../../components/forms/PhoneField'
import { useInputWarning, type InputWarningController } from '../../../../components/forms/useInputWarning'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { DEFAULT_PREFIX } from '../../../../constants/dropDownOptions'
import { AccountSettingsService, type CreateUserPayload, type UserAccountPayload } from '../../api/accountService'
import { normalizeUserPayload } from '../../utils/userTransformers'
import type { ActionComponentProps } from '../../../../resources_manager/managers/ActionManager'
import { ResponseManager } from '../../../../resources_manager/managers/ResponseManager'
import type { SettingsDataset, SettingsUserProfile } from '../../types'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ApiError } from '../../../../lib/api/ApiClient'
import { useSettingsStore, type SettingsDatasetUpdater } from '../../../../store/settings/useSettingsStore'

type FillUserAccountMode = 'create' | 'manage' | 'self'

export interface FillUserAccountPayload {
  mode?: FillUserAccountMode
  user?: SettingsUserProfile | null

}

interface UserFormState {
  username: string
  email: string
  password: string
  phone_number: PhoneValue
  profile_picture: string | null
}

interface UserFormSnapshot extends UserFormState {}

const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.webp,.heic,.gif'

export function FillUserAccount({
  payload,
  onClose,
  setPopupHeader,
  registerBeforeClose,
  setIsLoading,
}: ActionComponentProps<FillUserAccountPayload>) {
  const mode = payload?.mode ?? (payload?.user ? 'manage' : 'create')
  const isCreateMode = mode === 'create'
  const isSelfMode = mode === 'self'

  const accountService = useMemo(() => new AccountSettingsService(), [])
  const responseManager = useMemo(() => new ResponseManager(), [])
  const { showMessage } = useMessageManager()
  const dataset = useSettingsStore((state) => state.dataset)
  const updateDataset = useSettingsStore((state) => state.updateDataset)
  const currentUserFromDataset = dataset?.UserInfo ?? null

  const targetUser = useMemo<SettingsUserProfile | null>(() => {
    if (payload?.user) {
      return payload.user
    }
    if (isSelfMode) {
      return currentUserFromDataset
    }
    return null
  }, [currentUserFromDataset, isSelfMode, payload?.user])

  const [formState, setFormState] = useState<UserFormState>(() => createInitialFormState(targetUser))
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialSnapshotRef = useRef<UserFormSnapshot>(createSnapshotFromState(formState))

  const usernameWarning = useInputWarning('Username is required.')
  const emailWarning = useInputWarning('Email is required.')
  const passwordWarning = useInputWarning('Password is required.')
  const confirmPasswordWarning = useInputWarning('Passwords do not match.')

  const initials = useMemo(() => {
    const source = formState.username || targetUser?.username || targetUser?.email || ''
    return source
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  }, [formState.username, targetUser?.email, targetUser?.username])

  const profileRole = targetUser?.role ?? 'Member'
  const profileTeam = targetUser?.team ?? '—'

  useEffect(() => {
    const nextState = createInitialFormState(targetUser)
    setFormState(nextState)
    setConfirmPassword('')
    hideAllWarnings(usernameWarning, emailWarning, passwordWarning, confirmPasswordWarning)
    initialSnapshotRef.current = createSnapshotFromState(nextState)
    // warning controllers are intentionally omitted to avoid infinite reset loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUser])

  useEffect(() => {
    if (!setPopupHeader) {
      return
    }
    setPopupHeader(<FillUserAccountHeader mode={mode} username={targetUser?.username} />)
    return () => setPopupHeader(null)
  }, [mode, setPopupHeader, targetUser?.username])

  const hasPendingChanges = useMemo(() => {
    const initial = initialSnapshotRef.current
    if (!initial) {
      return true
    }
    if (initial.username !== formState.username) {
      return true
    }
    if (initial.email !== formState.email) {
      return true
    }
    if (!arePhonesEqual(initial.phone_number, formState.phone_number)) {
      return true
    }
    if ((initial.profile_picture ?? null) !== (formState.profile_picture ?? null)) {
      return true
    }
    if ((initial.password ?? '') !== (formState.password ?? '')) {
      return true
    }
    if (confirmPassword.trim()) {
      return true
    }
    return false
  }, [confirmPassword, formState])

  const updateField = useCallback(
    (field: keyof Pick<UserFormState, 'username' | 'email' | 'password'>) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        setFormState((prev) => ({ ...prev, [field]: value }))
      },
    [],
  )

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setConfirmPassword(value)
    if (formState.password && value && formState.password !== value) {
      confirmPasswordWarning.showWarning()
    } else {
      confirmPasswordWarning.hideWarning()
    }
  }

  const handlePhoneChange = useCallback((value: PhoneValue) => {
    setFormState((prev) => ({ ...prev, phone_number: value }))
  }, [])

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      showMessage({ status: 400, message: 'Please select a valid image file.' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormState((prev) => ({ ...prev, profile_picture: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  const validateForm = useCallback(() => {
    let isValid = true
    if (!formState.username.trim()) {
      usernameWarning.showWarning()
      isValid = false
    } else {
      usernameWarning.hideWarning()
    }
    if (!formState.email.trim()) {
      emailWarning.showWarning()
      isValid = false
    } else {
      emailWarning.hideWarning()
    }
    if (isCreateMode && !formState.password.trim()) {
      passwordWarning.showWarning()
      isValid = false
    } else if (!formState.password.trim()) {
      passwordWarning.hideWarning()
    } else {
      passwordWarning.hideWarning()
    }
    if ((formState.password || confirmPassword) && formState.password !== confirmPassword) {
      confirmPasswordWarning.showWarning('Passwords do not match.')
      isValid = false
    } else {
      confirmPasswordWarning.hideWarning()
    }
    const sanitizedPhone = sanitizePhoneValue(formState.phone_number)
    if (isCreateMode && !sanitizedPhone) {
      showMessage({ status: 400, message: 'Phone number is required.' })
      isValid = false
    }
    return isValid
  }, [
    confirmPassword,
    confirmPasswordWarning,
    emailWarning,
    formState.email,
    formState.password,
    formState.phone_number,
    formState.username,
    isCreateMode,
    passwordWarning,
    showMessage,
    usernameWarning,
  ])

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (isSubmitting) {
      return
    }
    const isValid = validateForm()
    if (!isValid) {
      return
    }
    const currentSnapshot = initialSnapshotRef.current
    const changedFields = resolveChangedFields(currentSnapshot, formState)

    if (!isCreateMode && (!changedFields || Object.keys(changedFields).length === 0)) {
      showMessage({ status: 200, message: 'No changes detected.' })
      return
    }

    setIsLoading(true)
    setIsSubmitting(true)
    try {
      if (isCreateMode) {
        await handleCreate(formState, {
          accountService,
          responseManager,
          updateDataset,
          showMessage,
        })
        onClose()
      } else {
        const normalized = await handleUpdate({
          accountService,
          responseManager,
          updateDataset,
          showMessage,
          formState,
          changedFields: changedFields ?? {},
          targetUser,
          updateUserInfo: isSelfMode,
        })
        if (isSelfMode && normalized) {
          const nextState = createInitialFormState(normalized)
          setFormState(nextState)
          setConfirmPassword('')
          initialSnapshotRef.current = createSnapshotFromState(nextState)
        } else {
          onClose()
        }
      }
    } catch (error) {
      handleRequestError(error, showMessage)
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [
    accountService,
    formState,
    isCreateMode,
    isSelfMode,
    isSubmitting,
    onClose,
    responseManager,
    setIsLoading,
    showMessage,
    targetUser,
    validateForm,
    updateDataset,
  ])

  useEffect(() => {
    if (!registerBeforeClose || isSelfMode) {
      return
    }
    if (!hasPendingChanges) {
      registerBeforeClose(undefined)
      return
    }
    registerBeforeClose({
      shouldWarn: () => hasPendingChanges,
      onSave: async () => {
        await handleSubmit()
      },
      message: 'You have unsaved changes. Save them before closing?',
      saveLabel: isCreateMode ? 'Create' : 'Save',
    })
    return () => registerBeforeClose(undefined)
  }, [handleSubmit, hasPendingChanges, isCreateMode, isSelfMode, registerBeforeClose])

  const submitLabel = isCreateMode ? 'Create user' : 'Save changes'

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative cursor-pointer"
            onClick={handleProfilePictureClick}
          >
            <button
              type="button"
              className="group relative flex items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--color-border)] bg-[var(--color-page)]"
              
              style={{ width: '7rem', height: '7rem' }}
            >
              <ProfilePicture src={formState.profile_picture} initials={initials} size={112} className="bg-transparent" />
              
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-[var(--color-primary)] p-2 text-white shadow-lg transition group-hover:scale-110">
                <CameraIcon className="app-icon h-4 w-4 text-white" />
              </span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleProfilePictureChange}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Profile</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {formState.username || targetUser?.username || 'New teammate'}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {profileRole} · {profileTeam}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-4">
        <Field label="Username" required warning={usernameWarning.warning}>
          <InputField value={formState.username} onChange={updateField('username')} warningController={usernameWarning} />
        </Field>

        <Field label="Email" required warning={emailWarning.warning}>
          <InputField
            type="email"
            value={formState.email}
            onChange={updateField('email')}
            warningController={emailWarning}
          />
        </Field>

        <PhoneField label="Phone number" value={formState.phone_number} onChange={handlePhoneChange} required />

        <Field label="Password" required={isCreateMode} warning={passwordWarning.warning}>
          <InputField
            type="password"
            value={formState.password}
            onChange={updateField('password')}
            warningController={passwordWarning}
          />
        </Field>

        <Field
          label="Confirm password"
          required={isCreateMode || Boolean(formState.password)}
          warning={confirmPasswordWarning.warning}
        >
          <InputField
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            warningController={confirmPasswordWarning}
          />
        </Field>
      </section>

      <div className="flex justify-end">
        <BasicButton
          params={{
            variant: 'primary',
            type: 'submit',
            disabled: isSubmitting,
          }}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </BasicButton>
      </div>
    </form>
  )
}

function FillUserAccountHeader({ mode, username }: { mode: FillUserAccountMode; username?: string }) {
  const title =
    mode === 'create' ? 'Create new user' : mode === 'manage' ? `Edit ${username ?? 'user'}` : 'Update your profile'
  const description =
    mode === 'create'
      ? 'Fill in the details to invite a new teammate.'
      : mode === 'manage'
      ? 'Review and edit user information.'
      : 'Keep your profile details up to date.'
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
      <span className="text-xs text-[var(--color-muted)]">{description}</span>
    </div>
  )
}

function createInitialFormState(user?: SettingsUserProfile | null): UserFormState {
  return {
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    phone_number: clonePhoneValue(user?.phone),
    profile_picture: user?.profilePicture ?? null,
  }
}

function clonePhoneValue(phone?: PhoneValue | null): PhoneValue {
  if (!phone) {
    return { prefix: DEFAULT_PREFIX, number: '' }
  }
  return { prefix: phone.prefix, number: phone.number }
}

function sanitizePhoneValue(phone?: PhoneValue | null): PhoneValue | null {
  if (!phone) {
    return null
  }
  const number = phone.number?.trim()
  if (!number) {
    return null
  }
  const prefix = phone.prefix?.trim() || DEFAULT_PREFIX
  return { prefix, number }
}

function createSnapshotFromState(state: UserFormState): UserFormSnapshot {
  return {
    username: state.username,
    email: state.email,
    password: state.password,
    phone_number: clonePhoneValue(state.phone_number),
    profile_picture: state.profile_picture,
  }
}

function hideAllWarnings(...controllers: InputWarningController[]) {
  controllers.forEach((controller) => controller.hideWarning())
}

function arePhonesEqual(a: PhoneValue, b: PhoneValue): boolean {
  return a.prefix === b.prefix && a.number === b.number
}

function resolveChangedFields(
  snapshot: UserFormSnapshot | null | undefined,
  state: UserFormState,
): Partial<UpdateUserPayloadFields> | null {
  const changes: Partial<UpdateUserPayloadFields> = {}
  if (!snapshot || snapshot.username !== state.username) {
    changes.username = state.username
  }
  if (!snapshot || snapshot.email !== state.email) {
    changes.email = state.email
  }
  if (!snapshot || !arePhonesEqual(snapshot.phone_number, state.phone_number)) {
    changes.phone_number = sanitizePhoneValue(state.phone_number)
  }
  if (!snapshot || (snapshot.profile_picture ?? null) !== (state.profile_picture ?? null)) {
    changes.profile_picture = state.profile_picture
  }
  if (state.password.trim()) {
    changes.password = state.password
  }
  const sanitized = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => {
      if (value == null) {
        return false
      }
      if (typeof value === 'string' && !value.trim()) {
        return false
      }
      return true
    }),
  ) as Partial<UpdateUserPayloadFields>

  return Object.keys(sanitized).length > 0 ? sanitized : null
}

type UpdateUserPayloadFields = {
  username: string
  email: string
  phone_number: PhoneValue | null
  profile_picture: string | null
  password: string
}

async function handleCreate(
  formState: UserFormState,
  context: {
    accountService: AccountSettingsService
    responseManager: ResponseManager
    updateDataset: SettingsDatasetUpdater
    showMessage: (payload: { status: number; message: string }) => void
  },
): Promise<SettingsUserProfile> {
  const { accountService, responseManager, updateDataset, showMessage } = context
  const payload = responseManager.sanitizePayload({
    username: formState.username,
    email: formState.email,
    password: formState.password,
    phone_number: sanitizePhoneValue(formState.phone_number),
    profile_picture: formState.profile_picture,
  }) as CreateUserPayload
  const response = await accountService.createUser(payload)
  const resolved = responseManager.resolveEntityFromResponse<UserAccountPayload>(response.data)
  if (!resolved?.id) {
    throw new Error('The server response did not include the created user.')
  }
  const fallback: UserAccountPayload = {
    id: resolved.id,
    username: formState.username,
    email: formState.email,
    phone_number: sanitizePhoneValue(formState.phone_number),
    profile_picture: formState.profile_picture,
    role: null,
    team: null,
  }
  const normalized = normalizeUserPayload(responseManager.mergeWithFallback(resolved, fallback))
  persistUser(updateDataset, normalized, { appendIfMissing: true })
  showMessage({
    status: response.status ?? 200,
    message: response.message ?? 'User created successfully.',
  })
  return normalized
}

async function handleUpdate(options: {
  accountService: AccountSettingsService
  responseManager: ResponseManager
  updateDataset: SettingsDatasetUpdater
  showMessage: (payload: { status: number; message: string }) => void
  formState: UserFormState
  changedFields: Partial<UpdateUserPayloadFields>
  targetUser: SettingsUserProfile | null
  updateUserInfo: boolean
}): Promise<SettingsUserProfile | null> {
  const {
    accountService,
    responseManager,
    updateDataset,
    showMessage,
    formState,
    changedFields,
    targetUser,
  } = options
  if (!targetUser) {
    throw new Error('Target user is required for updates.')
  }
  const payload = responseManager.sanitizePayload(changedFields)
  const response = await accountService.updateUser({
    id: targetUser.id,
    fields: payload,
  })
  const resolved = responseManager.resolveEntityFromResponse<UserAccountPayload>(response.data)
  const fallback: UserAccountPayload = {
    id: targetUser.id,
    username: formState.username || targetUser.username,
    email: formState.email || targetUser.email,
    phone_number: sanitizePhoneValue(formState.phone_number) ?? targetUser.phone ?? null,
    profile_picture: formState.profile_picture ?? targetUser.profilePicture ?? null,
    role: targetUser.rawRole ?? null,
    team: targetUser.rawTeam ?? null,
  }
  const normalized = normalizeUserPayload(responseManager.mergeWithFallback(resolved, fallback))
  persistUser(updateDataset, normalized, {
    appendIfMissing: true,
    updateUserInfo: options.updateUserInfo,
  })
  showMessage({
    status: response.status ?? 200,
    message: response.message ?? 'User updated successfully.',
  })
  return normalized
}

function persistUser(
  updateDataset: SettingsDatasetUpdater,
  user: SettingsUserProfile,
  options?: { appendIfMissing?: boolean; updateUserInfo?: boolean },
) {
  updateDataset((prev) => {
    const base: SettingsDataset = prev ?? { UserInfo: null, UsersList: [], MessageTemplates: null }
    const list = Array.isArray(base.UsersList) ? [...base.UsersList] : []
    const index = list.findIndex((candidate) => candidate.id === user.id)
    if (index >= 0) {
      list[index] = user
    } else if (options?.appendIfMissing) {
      list.push(user)
    }
    return {
      ...base,
      UserInfo: options?.updateUserInfo ? user : base.UserInfo,
      UsersList: list,
    }
  })
}

function handleRequestError(error: unknown, showMessage: (payload: { status: number; message: string }) => void) {
  const status = error instanceof ApiError ? error.status ?? 500 : 500
  const message =
    error instanceof ApiError && error.message ? error.message : 'Unable to process the request. Please try again.'
  showMessage({ status, message })
}
