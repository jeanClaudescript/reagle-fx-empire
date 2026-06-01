const FREE_ACCOUNT_CREATED_KEY = 'rfx_free_account_created'

export function markFreeAccountCreated() {
  try {
    sessionStorage.setItem(FREE_ACCOUNT_CREATED_KEY, String(Date.now()))
  } catch {
    /* private mode */
  }
}

export function peekFreeAccountCreated() {
  try {
    return sessionStorage.getItem(FREE_ACCOUNT_CREATED_KEY)
  } catch {
    return null
  }
}

export function clearFreeAccountCreated() {
  try {
    sessionStorage.removeItem(FREE_ACCOUNT_CREATED_KEY)
  } catch {
    /* ignore */
  }
}
