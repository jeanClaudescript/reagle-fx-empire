import { isAdminAuthenticated } from './adminSession'

export const ADMIN_LOGIN_PATH = '/login?tab=admin'

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/** Redirect away from admin routes when session is missing. Uses replace so Back won't reopen admin. */
export function redirectToAdminLogin() {
  if (window.location.pathname + window.location.search === ADMIN_LOGIN_PATH) return
  window.history.replaceState({}, '', ADMIN_LOGIN_PATH)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Map /admin routes to login when there is no valid admin session. */
export function resolvePathWithAdminGuard(pathname: string): string {
  if (isAdminPath(pathname) && !isAdminAuthenticated()) {
    if (pathname !== '/login') {
      window.history.replaceState({}, '', ADMIN_LOGIN_PATH)
    }
    return '/login'
  }
  return pathname
}
