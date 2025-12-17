import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useResourceManager } from '../../resources_manager/resourcesManagerContext'
import type { BeforeCloseConfig, ConfirmConfig } from '../../resources_manager/managers/ActionManager'
import { motion } from 'framer-motion'


function HeaderRow({
  title,
  description,
  headerContent,
  onClose,
}: {
  title: string
  description?: string
  headerContent?: ReactNode | null
  onClose?: () => void
}) {
  const isMobile = useResourceManager('isMobileObject')
  return (
    <header className={isMobile.isMobile ? `border-b border-[var(--color-border)] px-4 py-4`
    :`border-b border-[var(--color-border)] px-6 py-4`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {headerContent ?? (
            <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] transition hover:bg-[var(--color-accent)]"
        >
          Close
        </button>
      </div>
      {!headerContent && description && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">{description}</p>
      )}
    </header>
  )
}

function Body({ children }: { children: ReactNode }) {
  const isMobile = useResourceManager('isMobileObject')
  return <div className={isMobile.isMobile ? `flex-1 overflow-y-auto px-3 py-5 h-full`
    :`flex-1 overflow-y-auto px-6 py-5 min-h-[500px]`}>{children}</div>
}


interface PopupType{
    params?: {
      title?: string
      description?: string
    }
    children: ReactNode
    onRequestClose?: () => void
}

interface ConfirmationState {
  visible: boolean
  config?: BeforeCloseConfig & { onConfirm?: () => void | Promise<void> }
}

const Popup_1 = ({ params, children, onRequestClose }:PopupType ) => {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null)
  const popupManager = useResourceManager('popupManager')
  const beforeCloseConfigRef = useRef<BeforeCloseConfig | null>(null)
  const isMountedRef = useRef(true)
  const isMobile = useResourceManager('isMobileObject')
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const setPopupHeader = useCallback((content: ReactNode | null) => {
    setHeaderContent(content)
  }, [])
  const registerBeforeClose = useCallback((config?: BeforeCloseConfig) => {
    beforeCloseConfigRef.current = config ?? null
  }, [])
  const openConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmState({
      visible: true,
      config: {
        message: config.message,
        onConfirm: config.onConfirm,
        saveLabel: config.confirmLabel ?? 'Confirm',
        discardLabel: config.cancelLabel ?? 'Cancel',
      },
    })
  }, [])
  useEffect(() => {
    return () => {
      setHeaderContent(null)
      beforeCloseConfigRef.current = null
    }
  }, [])
  const { title = 'Popup', description = '' } = params ?? {}
  const renderedChild =
    isValidElement(children) && typeof children.type !== 'string'
      ? cloneElement(children as any, { setPopupHeader, registerBeforeClose, openConfirm } as any)
      : children
  const [confirmState, setConfirmState] = useState<ConfirmationState>({ visible: false })
  const [isConfirmSaving, setIsConfirmSaving] = useState(false)

  const closePopup = useCallback(() => {
    if (onRequestClose) {
      onRequestClose()
    } else {
      popupManager.close()
    }
  }, [onRequestClose, popupManager])

  const handleCloseAttempt = useCallback(async () => {
    const guard = beforeCloseConfigRef.current
    if (guard?.shouldWarn && guard.shouldWarn()) {
      setConfirmState({
        visible: true,
        config: guard,
      })
      return
    }
    closePopup()
  }, [closePopup])

  const handleConfirmDiscard = useCallback(() => {
    setConfirmState({ visible: false })
    closePopup()
  }, [closePopup])

  const handleConfirmSave = useCallback(async () => {
    const guard = confirmState.config
    const action = guard?.onConfirm ?? guard?.onSave
    if (!action) {
      return
    }
    setIsConfirmSaving(true)
    try {
      await action()
    } finally {
      if (isMountedRef.current) {
        setIsConfirmSaving(false)
        setConfirmState({ visible: false })
      }
    }
  }, [confirmState.config])
  return (
    
    <div className="fixed inset-0 z-[10] flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-[rgb(0,0,0,0.5)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Popup element */}
      <motion.div
        className={isMobile.isMobile ?`relative z-10 pointer-events-auto flex h-full w-full  flex-col  bg-white text-[var(--color-text)]`:
        `relative z-10 pointer-events-auto flex h-full w-full max-h-[800px] max-w-[600px] flex-col rounded-none border border-[var(--color-border)] bg-white text-[var(--color-text)] md:rounded-3xl`
        }
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <HeaderRow title={title} description={description} headerContent={headerContent} onClose={handleCloseAttempt} />
        <Body>{renderedChild}</Body>
        {confirmState.visible && (
          <div className="absolute inset-0 z-20 flex items-center justify-center  rounded-none bg-black/40 px-6 md:rounded-3xl">
            <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
              <p className="text-sm text-[var(--color-text)]">
                {confirmState.config?.message ?? 'You have unsaved changes. What would you like to do?'}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={handleConfirmDiscard}
                  disabled={isConfirmSaving}
                >
                  {confirmState.config?.discardLabel ?? 'Discard'}
                </button>
                {confirmState.config?.onConfirm || confirmState.config?.onSave ? (
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    onClick={handleConfirmSave}
                    disabled={isConfirmSaving}
                  >
                    {isConfirmSaving ? 'Saving...' : confirmState.config?.saveLabel ?? 'Save'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>

  )
}

export default Popup_1
