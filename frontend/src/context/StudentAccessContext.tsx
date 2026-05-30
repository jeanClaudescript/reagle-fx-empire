import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { StudentSessionError, studentApi } from '@/services/api'
import {
  clearStudentAuthToken,
  getStudentAuthToken,
  getStudentDeviceId,
  getStudentDeviceLabel,
  setStudentAuthToken,
} from '@/student/studentSession'
import { refreshAppSocketAuth } from '@/realtime/appSocket'

const STORAGE_KEY = 'rfx_student_contact'

export type StudentMembershipStatus = 'none' | 'paid' | 'unpaid' | 'not_found'

type Contact = { phone?: string; email?: string; name?: string }

type AccessState = {
  loading: boolean
  isPaid: boolean
  hasVipSession: boolean
  isLoggedIn: boolean
  membershipStatus: StudentMembershipStatus
  found: boolean
  contact: Contact | null
  referralCode?: string
  sessionError: string | null
  checkAccess: (input: Contact) => Promise<StudentMembershipStatus>
  refreshAccess: () => Promise<void>
  logout: () => Promise<void>
}

const StudentAccessContext = createContext<AccessState | null>(null)

async function establishVipSession(input: Contact) {
  const res = await studentApi.login({
    phone: input.phone,
    email: input.email,
    deviceId: getStudentDeviceId(),
    deviceLabel: getStudentDeviceLabel(),
  })
  setStudentAuthToken(res.data.token)
  refreshAppSocketAuth()
  return res.data.user
}

export function StudentAccessProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<Contact | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [hasVipSession, setHasVipSession] = useState(false)
  const [found, setFound] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<StudentMembershipStatus>('none')
  const [referralCode, setReferralCode] = useState<string>()
  const [sessionError, setSessionError] = useState<string | null>(null)

  const clearLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    clearStudentAuthToken()
    setContact(null)
    setIsPaid(false)
    setHasVipSession(false)
    setFound(false)
    setMembershipStatus('none')
    setReferralCode(undefined)
  }, [])

  const applyPaidUser = useCallback((next: Contact, ref?: string) => {
    setContact(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setFound(true)
    setIsPaid(true)
    setHasVipSession(true)
    setMembershipStatus('paid')
    if (ref) setReferralCode(ref)
    setSessionError(null)
  }, [])

  const applyResult = useCallback(
    (data: {
      found: boolean
      membershipStatus: 'paid' | 'unpaid'
      name?: string
      referralCode?: string
    }): StudentMembershipStatus => {
      setFound(data.found)
      if (!data.found) {
        setIsPaid(false)
        setHasVipSession(false)
        setMembershipStatus('not_found')
        return 'not_found'
      }
      const paid = data.membershipStatus === 'paid'
      setIsPaid(paid)
      setMembershipStatus(paid ? 'paid' : 'unpaid')
      if (!paid) setHasVipSession(false)
      if (data.referralCode) setReferralCode(data.referralCode)
      return paid ? 'paid' : 'unpaid'
    },
    [],
  )

  const checkAccess = useCallback(
    async (input: Contact) => {
      setLoading(true)
      setSessionError(null)
      try {
        const res = await studentApi.checkAccess(input)
        const next = { ...input, name: res.data.name ?? input.name }
        setContact(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

        if (res.data.found && res.data.membershipStatus === 'paid') {
          try {
            const user = await establishVipSession(next)
            applyPaidUser({ ...next, name: user.name ?? next.name }, user.referralCode)
            return 'paid' as const
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not start VIP session'
            setSessionError(msg)
            return applyResult(res.data)
          }
        }

        clearStudentAuthToken()
        setHasVipSession(false)
        return applyResult(res.data)
      } catch {
        clearLocal()
        return 'none'
      } finally {
        setLoading(false)
      }
    },
    [applyPaidUser, applyResult, clearLocal],
  )

  const restoreSession = useCallback(async () => {
    const token = getStudentAuthToken()
    if (!token) return false

    try {
      const res = await studentApi.me()
      const next: Contact = {
        phone: res.data.phone,
        email: res.data.email,
        name: res.data.name,
      }
      applyPaidUser(next, res.data.referralCode)
      refreshAppSocketAuth()
      return true
    } catch (err) {
      if (err instanceof StudentSessionError && err.code === 'SESSION_REVOKED') {
        setSessionError(err.message)
      }
      clearLocal()
      return false
    }
  }, [applyPaidUser, clearLocal])

  const logout = useCallback(async () => {
    try {
      if (getStudentAuthToken()) await studentApi.logout()
    } catch {
      /* ignore */
    }
    clearLocal()
    setSessionError(null)
    refreshAppSocketAuth()
  }, [clearLocal])

  const refreshAccess = useCallback(async () => {
    if (getStudentAuthToken()) {
      const ok = await restoreSession()
      if (ok) return
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Contact
      if (saved.phone || saved.email) await checkAccess(saved)
    } catch {
      /* ignore */
    }
  }, [checkAccess, restoreSession])

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      const restored = await restoreSession()
      if (restored) {
        setLoading(false)
        return
      }

      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Contact
          if (saved.phone || saved.email) {
            await checkAccess(saved)
            return
          }
        } catch {
          /* ignore */
        }
      }
      setLoading(false)
    }
    void boot()
  }, [checkAccess, restoreSession])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && getStudentAuthToken()) {
        void restoreSession()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [restoreSession])

  useEffect(() => {
    if (hasVipSession) refreshAppSocketAuth()
  }, [hasVipSession])

  const isLoggedIn = membershipStatus !== 'none' && contact !== null

  const value = useMemo(
    () => ({
      loading,
      isPaid,
      hasVipSession,
      isLoggedIn,
      membershipStatus,
      found,
      contact,
      referralCode,
      sessionError,
      checkAccess,
      refreshAccess,
      logout,
    }),
    [
      loading,
      isPaid,
      hasVipSession,
      isLoggedIn,
      membershipStatus,
      found,
      contact,
      referralCode,
      sessionError,
      checkAccess,
      refreshAccess,
      logout,
    ],
  )

  return <StudentAccessContext.Provider value={value}>{children}</StudentAccessContext.Provider>
}

export function useStudentAccess() {
  const ctx = useContext(StudentAccessContext)
  if (!ctx) throw new Error('useStudentAccess must be used within StudentAccessProvider')
  return ctx
}
