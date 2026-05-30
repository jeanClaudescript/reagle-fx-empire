import { useEffect, useState } from 'react'
import { AlertTriangle, Database, RefreshCw, Server } from 'lucide-react'
import { healthApi, hasAdminSession, type HealthStatus } from '@/services/api'
import { useCms } from '@/cms/CmsProvider'

export function AdminApiStatusBanner() {
  const { syncError, isSyncing, refreshFromServer } = useCms()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const signedIn = hasAdminSession()

  useEffect(() => {
    let cancelled = false
    const load = () => {
      healthApi
        .check()
        .then((data) => {
          if (!cancelled) {
            setHealth(data)
            setFetchError(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setHealth(null)
            setFetchError(true)
          }
        })
    }
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const dbBad = health?.db === 'connection_failed' || health?.db === 'not_configured'
  const show = !signedIn || fetchError || dbBad || Boolean(syncError)

  if (!show && !isSyncing) return null

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="status"
    >
      {isSyncing && (
        <p className="flex items-center gap-2 text-emerald-200">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing CMS with server…
        </p>
      )}
      {syncError && (
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            CMS sync: <strong>{syncError}</strong>
            {signedIn && (
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => void refreshFromServer()}
              >
                Retry
              </button>
            )}
          </span>
        </p>
      )}
      {!signedIn && (
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Sign in at <strong>/admin-login</strong> — admin actions use your database role, not an API
            key.
          </span>
        </p>
      )}
      {fetchError && (
        <p className="flex items-start gap-2">
          <Server className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cannot reach the API at <code className="text-xs">VITE_API_URL</code>. Check backend URL and
            CORS.
          </span>
        </p>
      )}
      {health && dbBad && (
        <p className="flex items-start gap-2">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Database: <strong>{health.db}</strong>
            {health.dbError ? ` — ${health.dbError}` : ''}. CMS needs MongoDB.
          </span>
        </p>
      )}
    </div>
  )
}
