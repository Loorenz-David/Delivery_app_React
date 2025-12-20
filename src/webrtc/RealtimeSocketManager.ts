import type { Socket } from 'socket.io-client'

import { createAuthorizedSocket } from './socketClient'

type SignalPayload = {
  payload: unknown
  target_user_id?: number | string | null
}

type DriverPositionPayload = {
  date_key: string
  driver_id: number | string
  coords: { lat: number; lng: number }
  timestamp?: number | string
}

type OrderNotePayload = {
  order_id: number | string
  note: string
}

type DriverPositionHandler = (payload: DriverPositionPayload) => void
type OrderNoteHandler = (payload: { order_id: number | string; note: string; author_id?: number | string }) => void
type SignalHandler = (payload: { from: number | string; payload: unknown }) => void

/**
 * Centralized real-time manager built on Socket.IO for:
 * - WebRTC signaling between the same user's devices.
 * - Live driver location streaming.
 * - Order note push notifications.
 *
 * Each event is namespaced following the backend contract in sockets/signaling.py.
 */
export class RealtimeSocketManager {
  private socket: Socket | null = null
  private lastToken: string | null = null

  private signalHandlers = new Set<SignalHandler>()
  private driverHandlers = new Set<DriverPositionHandler>()
  private noteHandlers = new Set<OrderNoteHandler>()

  constructor(socket?: Socket) {
    // defer socket creation until connect() so we can inject the latest token

    this.socket = socket ?? null
  }



  private registerCoreListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Realtime socket connected', this.socket?.id)
    })
    this.socket.on('connect_error', (err) => {
      // helpful for debugging connection issues
      console.warn('Realtime socket connect_error', err?.message || err)
    })

    this.socket.on('disconnect', () => {
    })

    this.socket.on('webrtc:signal', (payload) => {
      this.signalHandlers.forEach((cb) => cb(payload))
    })

    this.socket.on('drivers:position', (payload) => {
      this.driverHandlers.forEach((cb) => cb(payload))
    })

    this.socket.on('orders:note', (payload) => {
      this.noteHandlers.forEach((cb) => cb(payload))
    })
  }
  
  getSocket(){
    return this.socket
  }

  connect() {
    console.log('RealtimeSocketManager connecting...')
    const nextSocket = createAuthorizedSocket()
    const opts = nextSocket.io.opts as Record<string, unknown> & {
      auth?: Record<string, unknown>
      query?: Record<string, unknown>
    }
    const token = opts.auth?.token ?? opts.query?.token ?? null

    if (!token) {
      console.warn('RealtimeSocketManager connect skipped: missing socket token')
      return
    }
    if (this.socket?.connected && this.lastToken === token) {
      return
    }
    // Always rebuild the socket with the freshest token before connecting.
    if (this.socket) {
      this.socket.off() // clear old listeners before rebuilding
      this.socket.disconnect()
    }
    this.socket = nextSocket
    this.lastToken = token as string
    console.log(this.socket, "the socket created")
    this.registerCoreListeners()
    this.socket.connect()
  }

  disconnect() {
    this.socket?.off()
    this.socket?.disconnect()
    this.lastToken = null
  }

  refreshAuthToken() {
    // Rebuild the socket to include the latest token.
    this.connect()
  }

  // WebRTC signaling between devices of the same user
  sendSignal(payload: SignalPayload) {

    if (!this.socket) return

    this.socket.emit('webrtc:signal', {
      target_user_id: payload.target_user_id,
      payload: payload.payload,
    })

  }

  onSignal(handler: SignalHandler) {
    this.signalHandlers.add(handler)
    return () => this.signalHandlers.delete(handler)
  }

  // Driver live location
  subscribeDriverRoute(dateKey: string) {
    this.socket?.emit('drivers:subscribe_route', { date_key: dateKey })
  }

  sendDriverPosition(payload: DriverPositionPayload) {
    this.socket?.emit('drivers:position', payload)
  }

  onDriverPosition(handler: DriverPositionHandler) {
    this.driverHandlers.add(handler)
    return () => this.driverHandlers.delete(handler)
  }

  // Order notes / push notifications
  onOrderNote(handler: OrderNoteHandler) {
    this.noteHandlers.add(handler)
    return () => this.noteHandlers.delete(handler)
  }

  sendOrderNote(payload: OrderNotePayload) {
    this.socket?.emit('orders:note', payload)
  }
}

export const realtimeSocketManager = new RealtimeSocketManager()
