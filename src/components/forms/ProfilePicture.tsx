import { useState } from 'react'

interface ProfilePictureProps {
  src?: string | null
  initials: string
  size?: number
  className?: string
  alt?: string
}

export function ProfilePicture({ src, initials, size = 56, className = '', alt = 'profile picture' }: ProfilePictureProps) {
  const [isErrored, setIsErrored] = useState(false)

  const dimension = `${size}px`
  const shouldShowImage = Boolean(src && !isErrored)

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#e0f2ff] text-md font-semibold text-[var(--color-text)] ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {shouldShowImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          className="h-full w-full rounded-full object-cover"
          onError={() => setIsErrored(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}
