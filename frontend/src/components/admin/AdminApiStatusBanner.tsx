import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, Server } from 'lucide-react'
import { healthApi, hasAdminApiKey, type HealthStatus } from '@/services/api'

export function AdminApiStatusBanner() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const adminKey = hasAdminApiKey()

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
  const show =
    !adminKey || fetchError || dbBad || (health && !health.adminKeyConfigured)

  if (!show) return null

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="status"
    >
      {!adminKey && (
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>VITE_ADMIN_API_KEY</strong> is not set — CMS save, students, and payments will
            fail until you add it in your frontend env (must match backend ADMIN_API_KEY).
          </span>
        </p>
      )}
      {fetchError && (
        <p className="flex items-start gap-2">
          <Server className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cannot reach the API at <code className="text-xs">VITE_API_URL</code>. Check that the
            backend is running and CORS allows this origin.
          </span>
        </p>
      )}
      {health && dbBad && (
        <p className="flex items-start gap-2">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Database: <strong>{health.db}</strong>
            {health.dbError ? ` — ${health.dbError}` : ''}. CMS and payments need MongoDB.
          </span>
        </p>
      )}
      {health && !health.adminKeyConfigured && adminKey && (
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <span>API is up; backend has no ADMIN_API_KEY (open mode).</span>
        </p>
      )}
    </div>
  )
}
