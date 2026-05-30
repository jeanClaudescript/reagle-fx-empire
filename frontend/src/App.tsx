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
import { AdminDashboard } from '@/admin/AdminDashboard'
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

function App() {
  const [path, setPath] = useState(() => syncAppPath())

  useEffect(() => {
    const onPop = () => setPath(syncAppPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <ThemeProvider>
      <CmsProvider adminMode={path.startsWith('/admin')}>
        <LanguageProvider>
          <StudentAccessProvider>
            <AppRealtimeProvider>
            {path === '/login' ? (
              <LoginPage />
            ) : path === '/admin-login' ? (
              <AdminLogin />
            ) : path.startsWith('/admin') ? (
              <AdminDashboard />
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
