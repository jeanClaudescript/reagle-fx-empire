/** True when the user is on the admin CMS dashboard (not public marketing pages). */
export function isAdminApp() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}
