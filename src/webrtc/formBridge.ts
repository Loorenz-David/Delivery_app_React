import { realtimeSocketManager } from './RealtimeSocketManager'
import { createPeerConnection } from './webrtcPeerManager'

import type { AddressPayload } from '../features/home/types/backend'
import type { PhoneValue } from '../components/forms/PhoneField'

export type FormHandoffPayload = {
  client_first_name?: string
  client_second_name?: string
  client_email?: string
  client_primary_phone?: PhoneValue
  client_secondary_phone?: PhoneValue
  client_address?: AddressPayload | null
  note?: string
  open_form?: boolean
  channel?: RTCDataChannel | null 
}

type BridgeMessage =
  | { type: 'form-request'; payload: FormHandoffPayload }
  | { type: 'form-response'; payload: FormHandoffPayload }

export type BridgeStatus = 'idle' | 'connecting' | 'connected' | 'error'
type BridgeSignalPayload = {
  channel?: string
  sdp?: unknown
  candidate?: unknown
  [key: string]: unknown
}

const FORM_SIGNAL_CHANNEL = 'form-bridge'
const RECONNECT_DELAY_MS = 3000

/**
 * Handles WebRTC data-channel setup for form handoff between the same user's devices.
 * Uses Socket.IO signaling (webrtc:signal) and a dedicated data channel named "form-bridge".
 */
class FormBridge {
  private peer: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private status: BridgeStatus = 'idle'
  private lastError: string | null = null
  private isInitiator = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  private statusListeners = new Set<(status: BridgeStatus, error?: string | null) => void>()
  private messageListeners = new Set<(message: BridgeMessage) => void>()

  constructor() {
    // Listen for signaling messages coming from the backend
    realtimeSocketManager.onSignal(({ from, payload }) => {

      const signal = payload as { channel?: string } | null

      if (!signal || signal.channel !== FORM_SIGNAL_CHANNEL) return
      if (from === realtimeSocketManager.getSocket()?.id) return
      void this.handleSignal(signal as BridgeSignalPayload)
    })
  }

  getStatus(): BridgeStatus {
    return this.status
  }

  getLastError(): string | null {
    return this.lastError
  }

  onStatusChange(listener: (status: BridgeStatus, error?: string | null) => void) {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  onMessage(listener: (message: BridgeMessage) => void) {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  /**
   * Ensures a peer connection exists. If initiate is true, we create an offer immediately.
   */
  ensureConnection(options?: { initiate?: boolean }) {
    this.isInitiator = Boolean(options?.initiate)
    
    if (this.status === 'connected' || this.status === 'connecting') {
      return
    }

    this.startPeer(this.isInitiator)
  }

  /**
   * Send a form payload to the remote device.
   */
  sendFormRequest(payload: FormHandoffPayload): boolean {
    return this.sendMessage({ type: 'form-request', payload })
  }

  /**
   * Send a completed form back to the initiating device.
   */
  sendFormResponse(payload: FormHandoffPayload): boolean {
    return this.sendMessage({ type: 'form-response', payload })
  }

  private sendMessage(message: BridgeMessage): boolean {
    if (!this.channel || this.channel.readyState !== 'open') {
      this.setStatus('error', 'Data channel is not ready')
      return false
    }
    this.channel.send(JSON.stringify(message))
    return true
  }

  private setStatus(status: BridgeStatus, error: string | null = null) {
    this.status = status
    this.lastError = error
    this.statusListeners.forEach((listener) => listener(status, error))
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.startPeer(this.isInitiator)
    }, RECONNECT_DELAY_MS)
  }

  private resetPeer() {
    if (this.channel) {
      this.channel.onopen = null
      this.channel.onclose = null
      this.channel.onmessage = null
      this.channel.onerror = null
      this.channel.close()
    }
    if (this.peer) {
      this.peer.onicecandidate = null
      this.peer.ondatachannel = null
      this.peer.oniceconnectionstatechange = null
      this.peer.close()
    }
    this.channel = null
    this.peer = null
  }

  private startPeer(initiate: boolean) {
    this.clearReconnectTimer()
    this.resetPeer()
    this.setStatus('connecting', null)

    const { peer } = createPeerConnection()
    this.peer = peer

    peer.onicecandidate = (event) => {
      if (event.candidate) {

        realtimeSocketManager.sendSignal({
          payload: { channel: FORM_SIGNAL_CHANNEL, candidate: event.candidate },
        })

      }
    }

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState
      if (state === 'failed' || state === 'disconnected') {
        this.setStatus('error', 'Peer connection lost. Reconnecting...')
        this.scheduleReconnect()
      }
    }

    peer.ondatachannel = (event) => {
      this.channel = event.channel
      this.attachChannelHandlers()
    }

    if (initiate) {
      this.channel = peer.createDataChannel('form-bridge')
      this.attachChannelHandlers()
      void this.createAndSendOffer()
    }
  }

  private attachChannelHandlers() {
    if (!this.channel) return

    this.channel.onopen = () => {
      this.setStatus('connected', null)
      this.clearReconnectTimer()
    }

    this.channel.onclose = () => {
      this.setStatus('idle', null)
      this.scheduleReconnect()
    }

    this.channel.onerror = (event) => {
      this.setStatus('error', String(event))
      this.scheduleReconnect()
    }

    this.channel.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as BridgeMessage
        if (!parsed?.type) return
        this.messageListeners.forEach((listener) => listener(parsed))
      } catch (error) {
        console.warn('Failed to parse form-bridge message', error)
      }
    }
  }

  private async createAndSendOffer() {
    if (!this.peer) return
    try {
      const offer = await this.peer.createOffer()
      await this.peer.setLocalDescription(offer)

      realtimeSocketManager.sendSignal({
        payload: { channel: FORM_SIGNAL_CHANNEL, type: 'offer', sdp: offer },
      })
    } catch (error) {
      this.setStatus('error', 'Failed to create offer')
      console.error('Offer creation failed', error)
      this.scheduleReconnect()
    }
  }

  private async handleSignal(payload: any) {

    if (!payload) return

    if (!this.peer) {
      // We were not initialized yet; start as the answerer
      this.startPeer(false)
    }
    if (!this.peer) return

    try {
      if (payload.type === 'offer' && payload.sdp) {
        await this.peer.setRemoteDescription(payload.sdp)
        const answer = await this.peer.createAnswer()
        await this.peer.setLocalDescription(answer)
        realtimeSocketManager.sendSignal({
          payload: { channel: FORM_SIGNAL_CHANNEL, type: 'answer', sdp: answer },
        })
      } else if (payload.type === 'answer' && payload.sdp) {
        if (!this.peer.currentRemoteDescription) {
          await this.peer.setRemoteDescription(payload.sdp)
        }
      } else if (payload.candidate) {
        await this.peer.addIceCandidate(payload.candidate)
      }
    } catch (error) {
      this.setStatus('error', 'Signaling failed')
      console.error('Failed to handle signaling payload', error)
      this.scheduleReconnect()
    }
  }
}

export const formBridge = new FormBridge()
