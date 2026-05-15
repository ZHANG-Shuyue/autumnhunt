import { AlertCircle, Cloud, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSyncStore } from '../../store/useSyncStore'

export default function SyncStatusIndicator() {
  const navigate = useNavigate()
  const { syncStatus, pendingChanges } = useSyncStore((s) => ({
    syncStatus: s.syncStatus,
    pendingChanges: s.pendingChanges,
  }))

  if (!navigator.onLine) {
    return (
      <button type="button" onClick={() => navigate('/settings')} className="relative rounded-full p-2 hover:bg-primary-cream/20" title="离线中">
        <Cloud className="h-5 w-5 text-neutral-muted" />
        {pendingChanges > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary-rose px-1 text-[10px] text-white">{pendingChanges}</span>}
      </button>
    )
  }

  if (syncStatus === 'syncing') {
    return (
      <button type="button" onClick={() => navigate('/settings')} className="rounded-full p-2 hover:bg-primary-cream/20" title="同步中">
        <Loader2 className="h-5 w-5 animate-spin text-primary-cream" />
      </button>
    )
  }

  if (syncStatus === 'error') {
    return (
      <button type="button" onClick={() => navigate('/settings')} className="rounded-full p-2 hover:bg-primary-cream/20" title="同步失败">
        <AlertCircle className="h-5 w-5 text-primary-rose" />
      </button>
    )
  }

  return (
    <button type="button" onClick={() => navigate('/settings')} className="relative rounded-full p-2 hover:bg-primary-cream/20" title="已同步">
      <span className="block h-3 w-3 rounded-full bg-primary-sage" />
      {pendingChanges > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary-rose px-1 text-[10px] text-white">{pendingChanges}</span>}
    </button>
  )
}
