const SALT = 'autumnhunt-v1'

function strToBuf(text: string) {
  return new TextEncoder().encode(text)
}

function bufToBase64(buffer: Uint8Array) {
  return btoa(String.fromCharCode(...buffer))
}

function base64ToBuf(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
}

async function deriveKey() {
  const seed = navigator.userAgent
  const material = await crypto.subtle.importKey('raw', strToBuf(seed), { name: 'PBKDF2' }, false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: strToBuf(SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    material,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptToken(token: string) {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, strToBuf(token))
  return `${bufToBase64(iv)}.${bufToBase64(new Uint8Array(encrypted))}`
}

export async function decryptToken(payload: string) {
  const [ivPart, dataPart] = payload.split('.')
  if (!ivPart || !dataPart) return null

  try {
    const key = await deriveKey()
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuf(ivPart) },
      key,
      base64ToBuf(dataPart),
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}
