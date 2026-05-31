import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { getAdminAuthToken } from '@/admin/adminSession'
import { getStudentAuthToken } from '@/student/studentSession'
import { connectAppSocket, refreshAppSocketAuth } from './appSocket'

const AppRealtimeContext = createContext<{ connected: boolean }>({ connected: false })

export function AppRealtimeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const boot = () => {
      const admin = getAdminAuthToken()
      const student = getStudentAuthToken()
      if (admin) connectAppSocket('admin')
      else if (student) connectAppSocket('student')
      else connectAppSocket('guest')
    }

    boot()

    const onStorage = (e: StorageEvent) => {
      if (
        e.key?.includes('auth') ||
        e.key?.includes('session') ||
        e.key?.includes('student') ||
        e.key?.includes('admin-token')
      ) {
        refreshAppSocketAuth()
      }
    }
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(refreshAppSocketAuth, 30_000)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(id)
    }
  }, [])

  return <AppRealtimeContext.Provider value={{ connected: true }}>{children}</AppRealtimeContext.Provider>
}

export function useAppRealtime() {
  return useContext(AppRealtimeContext)
}
