import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { CameraIcon } from '../../../../assets/icons'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'

export interface AccountProfileData {
  username: string
  role: string
  team: string
  profilePicture?: string | null
}

interface AccountProfileCardProps {
  profile: AccountProfileData
  onPhotoChange?: (previewUrl: string, file?: File) => void
  isUploading?: boolean
}

const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.webp,.heic'

export function AccountProfileCard({ profile, onPhotoChange, isUploading = false }: AccountProfileCardProps) {
  const [preview, setPreview] = useState<string | null>(profile.profilePicture ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials =
    profile.username
      ?.split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  useEffect(() => {
    setPreview(profile.profilePicture ?? null)
  }, [profile.profilePicture])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setPreview(result)
      if (result) {
        const maybePromise = onPhotoChange?.(result, file)
        if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
          try {
            await maybePromise
          } catch {
            setPreview(profile.profilePicture ?? null)
          }
        }
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative">
          <button
            type="button"
            className="group relative flex items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--color-border)] bg-[var(--color-page)]"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            style={{ width: '7rem', height: '7rem' }}
          >
            <ProfilePicture src={preview} initials={initials} size={112} className="bg-transparent" />
            <span className="absolute bottom-2 right-2 rounded-full bg-[var(--color-primary)] p-2 text-white shadow-lg transition group-hover:scale-110">
              <CameraIcon className="app-icon h-4 w-4 text-white" />
            </span>
          </button>
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-semibold text-white">
              Uploading...
            </div>
          ) : null}
          <input
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            ref={inputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Your profile</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{profile.username}</p>
          <p className="text-sm text-[var(--color-muted)]">
            {profile.role} · {profile.team}
          </p>
        </div>
      </div>
    </section>
  )
}
