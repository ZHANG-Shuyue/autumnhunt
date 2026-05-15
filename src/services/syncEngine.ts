import { DATA_FILES, type SyncStoreKey } from '../config/github'
import { listFiles, readJsonFile, writeJsonFile } from './github'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useSyncStore } from '../store/useSyncStore'
import { useInterviewStore } from '../store/useInterviewStore'
import type { Application, CalendarEvent, Company, Interview } from '../types'
import type { CloudDataEnvelope, SyncRuntimeStatus } from '../types/github'
import { getDeviceId } from '../utils/device'
import { ensureUpdatedAtList, nowIso } from '../utils/record'

const shaCache: Partial<Record<SyncStoreKey, string>> = {}
const pushTimers: Partial<Record<SyncStoreKey, number>> = {}
let autoSyncEnabled = false

function getDataRepo() {
  const raw = localStorage.getItem('autumnhunt-auth')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { state?: { dataRepo?: string } }
    return parsed.state?.dataRepo ?? null
  } catch {
    return null
  }
}

function addSyncLog(message: string, level: 'info' | 'success' | 'error' = 'info') {
  useSyncStore.getState().addLog(message, level)
}

function withEnvelope<T extends { updatedAt?: string }>(items: T[]): CloudDataEnvelope<T & { updatedAt: string }> {
  return {
    schemaVersion: 1,
    updatedAt: nowIso(),
    deviceId: getDeviceId(),
    data: ensureUpdatedAtList(items),
  }
}

function hasRemoteNewer(remoteAt: string, localAt: string) {
  return new Date(remoteAt).getTime() > new Date(localAt).getTime()
}

function mergeByUpdatedAt<T extends { id: string; updatedAt?: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>()

  for (const item of local) {
    map.set(item.id, item)
  }

  for (const item of remote) {
    const current = map.get(item.id)
    if (!current) {
      map.set(item.id, item)
      continue
    }

    const remoteAt = item.updatedAt ? new Date(item.updatedAt).getTime() : 0
    const localAt = current.updatedAt ? new Date(current.updatedAt).getTime() : 0
    if (remoteAt >= localAt) {
      map.set(item.id, item)
    }
  }

  return [...map.values()]
}

async function pushCloudData<T extends { updatedAt?: string }>(storeKey: SyncStoreKey, data: T[], message: string) {
  const repoName = getDataRepo()
  if (!repoName) return

  const path = DATA_FILES[storeKey]
  const envelope = withEnvelope(data)
  const result = await writeJsonFile(repoName, path, envelope, shaCache[storeKey], message)
  shaCache[storeKey] = result.sha
}

function getStoreData() {
  return {
    companies: useCompanyStore.getState().companies,
    applications: useApplicationStore.getState().applications,
    interviews: useInterviewStore.getState().interviews,
    events: useCalendarStore.getState().events,
  }
}

export function resolveConflict<T extends { id: string; updatedAt?: string }>(local: T[], remote: T[]) {
  return mergeByUpdatedAt(local, remote)
}

export async function pullAll(): Promise<void> {
  const syncStore = useSyncStore.getState()
  const repoName = getDataRepo()
  if (!repoName) return

  syncStore.setStatus('syncing')
  syncStore.setError(null)
  addSyncLog('开始拉取云端数据')

  try {
    const files = await listFiles(repoName)
    const exists = new Set(files.map((file) => file.path))

    if (exists.has(DATA_FILES.companies)) {
      const { data, sha } = await readJsonFile<CloudDataEnvelope<Company>>(repoName, DATA_FILES.companies)
      shaCache.companies = sha
      const local = useCompanyStore.getState().companies
      const localEnvelope = withEnvelope(local)
      const merged = hasRemoteNewer(data.updatedAt, localEnvelope.updatedAt)
        ? resolveConflict(local, data.data)
        : local
      useCompanyStore.getState().replaceCompanies(ensureUpdatedAtList(merged))
    }

    if (exists.has(DATA_FILES.applications)) {
      const { data, sha } = await readJsonFile<CloudDataEnvelope<Application>>(repoName, DATA_FILES.applications)
      shaCache.applications = sha
      const local = useApplicationStore.getState().applications
      const localEnvelope = withEnvelope(local)
      const merged = hasRemoteNewer(data.updatedAt, localEnvelope.updatedAt)
        ? resolveConflict(local, data.data)
        : local
      useApplicationStore.getState().replaceApplications(ensureUpdatedAtList(merged))
    }

    if (exists.has(DATA_FILES.interviews)) {
      const { data, sha } = await readJsonFile<CloudDataEnvelope<Interview>>(repoName, DATA_FILES.interviews)
      shaCache.interviews = sha
      const local = useInterviewStore.getState().interviews
      const localEnvelope = withEnvelope(local)
      const merged = hasRemoteNewer(data.updatedAt, localEnvelope.updatedAt)
        ? resolveConflict(local, data.data)
        : local
      useInterviewStore.getState().replaceInterviews(ensureUpdatedAtList(merged))
    }

    if (exists.has(DATA_FILES.events)) {
      const { data, sha } = await readJsonFile<CloudDataEnvelope<CalendarEvent>>(repoName, DATA_FILES.events)
      shaCache.events = sha
      const local = useCalendarStore.getState().events
      const localEnvelope = withEnvelope(local)
      const merged = hasRemoteNewer(data.updatedAt, localEnvelope.updatedAt)
        ? resolveConflict(local, data.data)
        : local
      useCalendarStore.getState().replaceEvents(ensureUpdatedAtList(merged))
    }

    useCalendarStore.getState().syncFromOtherStores()
    const now = nowIso()
    syncStore.setLastPullAt(now)
    syncStore.setStatus('success')
    addSyncLog('云端拉取完成', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '拉取失败'
    syncStore.setError(message)
    addSyncLog(`拉取失败：${message}`, 'error')
    throw error
  }
}

export async function pushAll(): Promise<void> {
  const syncStore = useSyncStore.getState()
  const repoName = getDataRepo()
  if (!repoName) return

  syncStore.setStatus('syncing')
  syncStore.setError(null)
  addSyncLog('开始推送全部数据')

  try {
    const data = getStoreData()
    await pushCloudData('companies', data.companies, 'chore(sync): update companies')
    await pushCloudData('applications', data.applications, 'chore(sync): update applications')
    await pushCloudData('interviews', data.interviews, 'chore(sync): update interviews')
    await pushCloudData('events', data.events, 'chore(sync): update events')

    const now = nowIso()
    syncStore.setLastPushAt(now)
    syncStore.clearPendingChanges()
    syncStore.setStatus('success')
    addSyncLog('全部数据已同步', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '推送失败'
    syncStore.setError(message)
    addSyncLog(`推送失败：${message}`, 'error')
    throw error
  }
}

export async function pushOne(storeKey: SyncStoreKey): Promise<void> {
  const syncStore = useSyncStore.getState()
  const repoName = getDataRepo()
  if (!repoName) return
  if (!autoSyncEnabled || !syncStore.autoSyncEnabled) return
  if (!navigator.onLine) return

  const timer = pushTimers[storeKey]
  if (timer) window.clearTimeout(timer)

  pushTimers[storeKey] = window.setTimeout(async () => {
    try {
      syncStore.setStatus('syncing')
      const storeData = getStoreData()
      if (storeKey === 'companies') {
        await pushCloudData('companies', storeData.companies, 'chore(sync): update companies')
      } else if (storeKey === 'applications') {
        await pushCloudData('applications', storeData.applications, 'chore(sync): update applications')
      } else if (storeKey === 'interviews') {
        await pushCloudData('interviews', storeData.interviews, 'chore(sync): update interviews')
      } else {
        await pushCloudData('events', storeData.events, 'chore(sync): update events')
      }
      syncStore.setLastPushAt(nowIso())
      syncStore.setStatus('success')
      syncStore.clearPendingChanges()
      addSyncLog(`${storeKey} 已自动同步`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '自动同步失败'
      syncStore.setError(message)
      addSyncLog(`${storeKey} 自动同步失败：${message}`, 'error')
    }
  }, 3000)
}

export function enableAutoSync(): void {
  if (autoSyncEnabled) return
  autoSyncEnabled = true
  useSyncStore.getState().setAutoSyncEnabled(true)
}

export function disableAutoSync(): void {
  autoSyncEnabled = false
  useSyncStore.getState().setAutoSyncEnabled(false)
  Object.values(pushTimers).forEach((timer) => {
    if (timer) window.clearTimeout(timer)
  })
}

export function getSyncStatus(): SyncRuntimeStatus {
  const syncStore = useSyncStore.getState()
  return {
    enabled: autoSyncEnabled && syncStore.autoSyncEnabled,
    online: navigator.onLine,
    pendingChanges: syncStore.pendingChanges,
  }
}
