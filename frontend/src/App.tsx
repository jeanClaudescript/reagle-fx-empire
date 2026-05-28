import { LanguageProvider } from '@/context/LanguageContext'
import { StudentAccessProvider } from '@/context/StudentAccessContext'
import { PaidStudentPopup } from '@/components/student/PaidStudentPopup'
import { ThemeProvider } from '@/context/ThemeContext'
import { CmsProvider } from '@/cms/CmsProvider'
import { useEffect, useState } from 'react'
import { PublicSite } from '@/pages/PublicSite'
import { PayPage } from '@/pages/PayPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminLogin } from '@/admin/AdminLogin'
import { AdminDashboard } from '@/admin/AdminDashboard'
import { MediaViewerProvider } from '@/components/admin/media/MediaViewerContext'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <ThemeProvider>
      <CmsProvider>
        <LanguageProvider>
          <StudentAccessProvider>
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
          ) : (
            <MediaViewerProvider>
              <PublicSite />
              <PaidStudentPopup />
            </MediaViewerProvider>
          )}
          </StudentAccessProvider>
        </LanguageProvider>
      </CmsProvider>
    </ThemeProvider>
  )
}

export default App
