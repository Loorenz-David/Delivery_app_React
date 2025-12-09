import type { HTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'

export function SurfaceCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'SurfaceCard w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-lg shadow-[rgba(15,23,42,0.05)]',
        className,
      )}
      {...rest}
    />
  )
}

