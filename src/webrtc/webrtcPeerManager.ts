/**
  Simple factory for creating RTCPeerConnection instances for device-to-device flows.
  This focuses on signaling plumbing; media/data channel wiring is left to the caller.
*/

export type PeerFactoryOptions = {
  iceServers?: RTCIceServer[]
}

export const createPeerConnection = (options?: PeerFactoryOptions) => {
  const config: RTCConfiguration = {
    iceServers:
      options?.iceServers ??
      [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
  }

  const peer = new RTCPeerConnection(config)

  // Helper to attach verbose logs; handy for debugging first integrations.
  const attachDebugLogging = () => {
    peer.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        console.debug('New ICE candidate', event.candidate)
      }
    })
    peer.addEventListener('connectionstatechange', () => {
      console.debug('Peer connection state', peer.connectionState)
    })
  }

  return { peer, attachDebugLogging }
}
