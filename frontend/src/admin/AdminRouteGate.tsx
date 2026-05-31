import { useEffect, useState } from 'react'
import { authApi } from '@/services/api'
import { refreshAppSocketAuth } from '@/realtime/appSocket'
import { AdminDashboard } from '@/admin/AdminDashboard'
import { clearAdminSession, isAdminAuthenticated } from '@/admin/adminSession'
import { redirectToAdminLogin } from '@/admin/adminRouteGuard'

export function AdminRouteGate() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const deny = () => {
      if (cancelled) return
      setAllowed(false)
      redirectToAdminLogin()
    }

    if (!isAdminAuthenticated()) {
      deny()
      return () => {
        cancelled = true
      }
    }

    void authApi
      .me()
      .then(() => {
        if (!cancelled) setAllowed(true)
      })
      .catch(() => {
        clearAdminSession()
        refreshAppSocketAuth()
        deny()
      })

    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      if (!isAdminAuthenticated()) {
        clearAdminSession()
        refreshAppSocketAuth()
        deny()
      }
    }

    window.addEventListener('pageshow', onPageShow)
    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (!allowed) return null

  return <AdminDashboard />
}
