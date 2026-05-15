const DEVICE_KEY = 'autumnhunt-device-id'

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDeviceId() {
  const current = localStorage.getItem(DEVICE_KEY)
  if (current) return current
  const created = randomId()
  localStorage.setItem(DEVICE_KEY, created)
  return created
}
