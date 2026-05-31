import { LanguageProvider } from '@/context/LanguageContext'
import { StudentAccessProvider } from '@/context/StudentAccessContext'
import { AppRealtimeProvider } from '@/realtime/AppRealtimeProvider'
import { ThemeProvider } from '@/context/ThemeContext'
import { PaidStudentPopup } from '@/components/student/PaidStudentPopup'
import { CmsProvider } from '@/cms/CmsProvider'
import { useEffect, useState } from 'react'
import { PublicSite } from '@/pages/PublicSite'
import { PayPage } from '@/pages/PayPage'
import { LoginPage } from '@/pages/LoginPage'
import { StudentDeskPage } from '@/pages/StudentDeskPage'
import { ClassroomRoomPage } from '@/pages/ClassroomRoomPage'
import { AdminLogin } from '@/admin/AdminLogin'
import { AdminRouteGate } from '@/admin/AdminRouteGate'
import { isAdminAuthenticated } from '@/admin/adminSession'
import { resolvePathWithAdminGuard } from '@/admin/adminRouteGuard'
import { MediaViewerProvider } from '@/components/admin/media/MediaViewerContext'
import { captureReferralFromSearch, resolveReferralPath } from '@/referral/referralStorage'

function syncAppPath() {
  captureReferralFromSearch(window.location.search)
  const resolved = resolveReferralPath(window.location.pathname)
  if (resolved.captured) {
    window.history.replaceState({}, '', '/login?mode=signup')
    return '/login'
  }
  return window.location.pathname
}

function readAppPath() {
  return resolvePathWithAdminGuard(syncAppPath())
}

function App() {
  const [path, setPath] = useState(() => readAppPath())

  useEffect(() => {
    const onPop = () => setPath(readAppPath())
    window.addEventListener('popstate', onPop)

    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      setPath(readAppPath())
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const adminMode = path.startsWith('/admin') && isAdminAuthenticated()

  return (
    <ThemeProvider>
      <CmsProvider adminMode={adminMode}>
        <LanguageProvider>
          <StudentAccessProvider>
            <AppRealtimeProvider>
            {path === '/login' ? (
              <LoginPage />
            ) : path === '/admin-login' ? (
              <AdminLogin />
            ) : path.startsWith('/admin') ? (
              <AdminRouteGate />
            ) : path === '/pay' ? (
              <MediaViewerProvider>
                <PayPage />
              </MediaViewerProvider>
            ) : path === '/desk' ? (
              <StudentDeskPage />
            ) : path.startsWith('/classroom/') ? (
              <ClassroomRoomPage />
            ) : (
              <MediaViewerProvider>
                <PublicSite />
                <PaidStudentPopup />
              </MediaViewerProvider>
            )}
            </AppRealtimeProvider>
          </StudentAccessProvider>
        </LanguageProvider>
      </CmsProvider>
    </ThemeProvider>
  )
}

export default App
