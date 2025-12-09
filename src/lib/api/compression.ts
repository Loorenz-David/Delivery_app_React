import { gzip, ungzip } from 'pako'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const BINARY_CHUNK = 0x8000

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (let index = 0; index < bytes.length; index += BINARY_CHUNK) {
    const chunk = bytes.subarray(index, index + BINARY_CHUNK)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }

  return btoa(binary)
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export function compressPayload(payload: unknown): string {
  const serialized = JSON.stringify(payload)
  const utf8Bytes = textEncoder.encode(serialized)
  const compressed = gzip(utf8Bytes)

  return uint8ToBase64(compressed)
}

export function decompressPayload<T>(payload: string): T {
  const compressedBytes = base64ToUint8(payload)
  const decompressedBytes = ungzip(compressedBytes)
  const json = textDecoder.decode(decompressedBytes)

  return JSON.parse(json) as T
}

export function maybeDecompress<T>(payload: unknown, isCompressed: boolean): T {
  if (!isCompressed) {
    return payload as T
  }

  if (typeof payload !== 'string') {
    throw new Error('Expected base64 string for compressed payload')
  }

  return decompressPayload<T>(payload)
}

