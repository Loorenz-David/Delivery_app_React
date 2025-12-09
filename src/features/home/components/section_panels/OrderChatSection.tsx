import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSectionPanel } from '../../contexts/SectionPanelContext'
import { useResourceManager } from '../../../../resources_manager/resourcesManagerContext'
import { SendIcon } from '../../../../assets/icons'

import { BasicButton } from '../../../../components/buttons/BasicButton'
import { ProfilePicture } from '../../../../components/forms/ProfilePicture'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import { ChatService } from '../../api/chatService'
import { sessionStorage } from '../../../../lib/storage/sessionStorage'
import type { ChatNote, OrderPayload, RoutePayload } from '../../types/backend'

import type { ActionPayload } from '../../../../resources_manager/managers/ActionManager'


interface ChatOrderSectionProps{
    payload?:ActionPayload
    onClose: ()=> void
}

const ChatSection = ({
    payload,
    onClose
}:ChatOrderSectionProps) => {
     // Use Contexts
    const {setHeaderActions, setInteractionActions} = useSectionPanel()
    const routesDataManager = useResourceManager('routesDataManager')
    const optionDataManager = useResourceManager('optionDataManager')
    const { showMessage } = useMessageManager()
    const chatService = useMemo(() => new ChatService(), [])
    const [draft, setDraft] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [messages, setMessages] = useState<ChatNote[]>([])

    const payloadRecord = payload as Record<string, unknown> | undefined
    const payloadRouteId = typeof payloadRecord?.['routeId'] === 'number' ? (payloadRecord['routeId'] as number) : undefined
    const payloadOrderId = typeof payloadRecord?.['orderId'] === 'number' ? (payloadRecord['orderId'] as number) : undefined

    const selectedRoute = routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
    const selectedOrder = routesDataManager.getActiveSelection<OrderPayload>('SelectedOrder')
    const resolvedRouteId =
        (typeof selectedOrder?.meta?.['routeId'] === 'number' ? (selectedOrder.meta?.['routeId'] as number) : undefined) ??
        (typeof selectedRoute?.id === 'number' ? (selectedRoute.id as number) : undefined) ??
        payloadRouteId ??
        null
    const route =
        selectedRoute?.data ??
        (resolvedRouteId != null
            ? routesDataManager.find<RoutePayload>(resolvedRouteId, { collectionKey: 'routes', targetKey: 'id' }) ?? null
            : null)
    const resolvedOrderId = (typeof selectedOrder?.id === 'number' ? (selectedOrder.id as number) : undefined) ?? payloadOrderId
    const order =
        selectedOrder?.data ??
        (resolvedOrderId != null
            ? route?.delivery_orders?.find((entry: OrderPayload) => entry.id === resolvedOrderId) ?? null
            : null)

    const notes = useMemo(() => {
        const entries: ChatNote[] = Array.isArray(order?.notes_chat) ? (order.notes_chat as ChatNote[]) : []
        return [...entries].sort((a, b) => {
            const aTime = (a as any)?.timestamp ?? (a as any)?.created_at ?? 0
            const bTime = (b as any)?.timestamp ?? (b as any)?.created_at ?? 0
            return String(aTime).localeCompare(String(bTime))
        })
    }, [order?.id, order?.notes_chat])

    useEffect(() => {
        setMessages(notes)
        setDraft('')
    }, [notes, order?.id])

    useEffect(() => {
        if (setHeaderActions) {
            setHeaderActions([
                <BasicButton
                    key="close-chat"
                    params={{ variant: 'secondary', onClick: onClose }}
                    children={
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">
                            Close
                        </div>
                    }
                />,
            ])
        }
        if (setInteractionActions) {
            setInteractionActions([])
        }
    }, [onClose, setHeaderActions, setInteractionActions])

    const driversMap = optionDataManager.getDataset()?.drivers_map as Record<string | number, any> | undefined

    const resolveUser = useCallback(
        (id: number | string | null | undefined) => {
            if (!id || !driversMap) return null
            return driversMap[id as keyof typeof driversMap] ?? null
        },
        [driversMap],
    )

    const formatTimestamp = useCallback((raw: any) => {
        if (!raw) return ''

        const pad = (n: number) => String(n).padStart(2, '0')

        const parseCustom = (value: string) => {
            const match = /^(\d{4})\/(\d{2})\/(\d{2})\s*-\s*(\d{2}):(\d{2})/.exec(value)
            if (!match) return null
            const [, y, m, d, hh, mm] = match
            const year = Number(y)
            const month = Number(m) - 1
            const day = Number(d)
            const hours = Number(hh)
            const minutes = Number(mm)
            return new Date(year, month, day, hours, minutes)
        }

        const parsed =
            typeof raw === 'string'
                ? parseCustom(raw) ?? new Date(raw)
                : raw instanceof Date
                  ? raw
                  : new Date(raw)

        const isValid = parsed instanceof Date && !Number.isNaN(parsed.valueOf())
        if (!isValid) {
            return String(raw)
        }

        const now = new Date()
        const sameDay =
            parsed.getFullYear() === now.getFullYear() &&
            parsed.getMonth() === now.getMonth() &&
            parsed.getDate() === now.getDate()
        const datePart = `${parsed.getFullYear()}/${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())}`
        const timePart = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
        return sameDay ? timePart : `${datePart} • ${timePart}`
    }, [])

    const getInitials = (name?: string | null) => {
        if (!name) return '??'
        const parts = name.split(' ').filter(Boolean)
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase()
        }
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
    }

    const buildOutgoingMessage = (): ChatNote => {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const timestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} - ${pad(now.getHours())}:${pad(
            now.getMinutes(),
        )}`
        return {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${now.valueOf()}`,
            author: sessionStorage.getSession()?.user?.email ?? 'You',
            created_at: now.toISOString(),
            timestamp,
            message: draft.trim(),
            sender: sessionStorage.getSession()?.user?.id ?? null,
            seenBy: [],
        }
    }

    const handleSend = async () => {
        if (!draft.trim() || !order) return
        const next = buildOutgoingMessage()
        setIsSending(true)
        try {
            await chatService.appendChat({ id: order.id, chat: next })
            setMessages((prev) => [...prev, next])

            routesDataManager.updateDataset((prev) => {
                if (!prev || !Array.isArray(prev.routes)) return prev
                const updatedRoutes = prev.routes.map((routeEntry) => {
                    if (routeEntry.id !== resolvedRouteId) return routeEntry
                    const updatedOrders = (routeEntry.delivery_orders ?? []).map((ord) => {
                        if (ord.id !== order.id) return ord
                        const existingChat = Array.isArray(ord.notes_chat) ? ord.notes_chat : []
                        return {
                            ...ord,
                            notes_chat: [...existingChat, next],
                        }
                    })
                    return { ...routeEntry, delivery_orders: updatedOrders }
                })
                return { ...prev, routes: updatedRoutes }
            })
            // refresh active route selection with latest orders for consumers that rely on it
            const activeRoute = routesDataManager.getActiveSelection<RoutePayload>('SelectedRoute')
            if (activeRoute && activeRoute.id === resolvedRouteId) {
                const updatedRouteData = routesDataManager.getDataset()?.routes?.find((r) => r.id === resolvedRouteId)
                if (updatedRouteData) {
                    routesDataManager.setActiveSelection('SelectedRoute', {
                        id: resolvedRouteId ?? null,
                        data: updatedRouteData,
                        meta: activeRoute.meta,
                    })
                }
            }

            const updatedOrder = {
                ...order,
                notes_chat: [...(Array.isArray(order.notes_chat) ? order.notes_chat : []), next],
            }
            routesDataManager.setActiveSelection('SelectedOrder', {
                id: order.id,
                data: updatedOrder,
                meta: selectedOrder?.meta,
            })

            setDraft('')
            
        } catch (error) {
            console.error('Failed to send chat', error)
            showMessage({ status: 500, message: 'Unable to send message. Please try again.' })
        } finally {
            setIsSending(false)
        }
    }

    if (!route || !order) {
        return <p className="text-sm text-gray-500">Order not found.</p>
    }

    return (
        <div className="flex h-full flex-col gap-3 py-3">
           
            <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm">
                {messages.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">No messages yet.</p>
                ) : (
                    <div className="space-y-3 flex flex-col  pt-2">
                        {messages.map((entry, index) => (
                            <MessageCard
                                key={`chat-${index}-${(entry as any)?.id ?? (entry as any)?.timestamp ?? index}`}
                                entry={entry}
                                resolveUser={resolveUser}
                                formatTimestamp={formatTimestamp}
                                getInitials={getInitials}
                                currentUserId={sessionStorage.getSession()?.user?.id ?? null}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-white p-3 shadow-sm">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a message..."
                    className="h-12 flex-1 resize-none   px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
                <BasicButton
                    params={{
                        variant: 'darkBlue',
                        className: 'px-2 py-2',
                        onClick: handleSend,
                        disabled: !draft.trim() || isSending,
                    }}
                >
                    {isSending ? 'Sending...' : 
                    <SendIcon className="app-icon-page h-4 w-4" />
                    }
                    
                </BasicButton>
            </div>
        </div>
    )
}
 
function MessageCard({
    entry,
    resolveUser,
    formatTimestamp,
    getInitials,
    currentUserId,
}: {
    entry: Record<string, any>
    resolveUser: (id: number | string | null | undefined) => any
    formatTimestamp: (raw: any) => string
    getInitials: (name?: string | null) => string
    currentUserId: string | number | null
}) {
    const [isHover, setIsHover] = useState(false)
    const record = entry as any
    const senderId = record.sender ?? record.author_id ?? record.user_id ?? null
    const isSelf = currentUserId != null && String(currentUserId) === String(senderId ?? '')
    const senderUser = resolveUser(senderId)
    const senderName = senderUser?.username ?? record.sender_name ?? record.author ?? 'Unknown'
    const senderRole = senderUser?.role ?? senderUser?.role_name ?? ''
    const senderAvatar = senderUser?.profile_picture ?? senderUser?.avatar_url ?? null
    const initials = getInitials(senderName)
    const message = record.message ?? record.text ?? ''
    const timestamp = record.timestamp ?? record.created_at ?? ''
    const seenBy = record.seenBy ?? record.seen_by
    const seenByResolved: string[] = []
    if (Array.isArray(seenBy)) {
        seenBy.forEach((id: any) => {
            const user = resolveUser(id)
            if (!user) return
            const name = user.username ?? user.name ?? user.email ?? ''
            if (name) {
                seenByResolved.push(name)
            }
        })
    }
    const primarySeen = seenByResolved[0] ?? ''
    const remainingSeen = seenByResolved.slice(1)

    const layoutClass = isSelf ? 'flex-row-reverse text-right' : 'flex-row'
    const alignBubble = isSelf ? 'bg-[var(--color-primary)]/5' : 'bg-[var(--color-light-blue)]/10'
    const infoOrder = isSelf ? 'flex-row-reverse' : 'flex-row'

    return (
        <div className={`flex items-start gap-3 ${layoutClass}`}>
            <div onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} className="relative">
                <ProfilePicture src={senderAvatar} initials={initials} size={35} className="shadow-sm" />
                {isHover && (
                    <div
                        className={`absolute ${isSelf ? 'right-12' : 'left-12'} top-1 z-50 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-xl`}
                    >
                        <p className="text-sm font-semibold text-[var(--color-text)]">{senderName}</p>
                        {senderRole ? <p className="text-xs text-[var(--color-muted)]">Role: {String(senderRole)}</p> : null}
                    </div>
                )}
            </div>
            <div className="flex-1">
                <div className={`flex items-center gap-2 ${infoOrder}`}>
                    <span className="text-sm font-semibold text-[var(--color-text)]">{senderName}</span>
                    <span className="text-[11px] text-[var(--color-muted)]">{formatTimestamp(timestamp)}</span>
                </div>
                <div className={`mt-1 rounded-md ${alignBubble} px-3 py-2 text-sm text-[var(--color-text)] shadow-inner`}>
                    <p className="whitespace-pre-wrap break-words">{message || '-'}</p>
                </div>
                {seenByResolved.length > 0 ? (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
                        <span className="font-semibold">Seen by:</span>
                        <span>{primarySeen}</span>
                        {remainingSeen.length > 0 ? (
                            <details className="cursor-pointer">
                                <summary className="list-none text-[var(--color-primary)]">...</summary>
                                <div className="ml-2 mt-1 space-y-0.5 rounded-md border border-[var(--color-border)] bg-white p-2 shadow-sm">
                                    {remainingSeen.map((name, i) => (
                                        <div key={`${record.id ?? timestamp}-seen-${i}`} className="text-[10px] text-[var(--color-text)]">
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default ChatSection;
